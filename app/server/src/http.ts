import type http from 'node:http';
import { HttpError } from './errors.ts';

export interface Result { status?: number; body?: unknown }
export interface Ctx {
  req: http.IncomingMessage;
  url: URL;
  params: Record<string, string>;
  query: URLSearchParams;
  json: () => Promise<Record<string, unknown>>;
  buffer: (limit?: number) => Promise<Buffer>;
}
export type Handler = (ctx: Ctx) => Promise<Result> | Result;

interface Route { method: string; re: RegExp; keys: string[]; handler: Handler }

export class Router {
  routes: Route[] = [];
  add(method: string, pattern: string, handler: Handler): void {
    const keys: string[] = [];
    const re = new RegExp('^' + pattern.replace(/:([A-Za-z]+)/g, (_, k: string) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    this.routes.push({ method, re, keys, handler });
  }
  get = (p: string, h: Handler) => this.add('GET', p, h);
  post = (p: string, h: Handler) => this.add('POST', p, h);
  patch = (p: string, h: Handler) => this.add('PATCH', p, h);
  put = (p: string, h: Handler) => this.add('PUT', p, h);
  delete = (p: string, h: Handler) => this.add('DELETE', p, h);

  match(method: string, pathname: string): { handler: Handler; params: Record<string, string> } | 'method' | undefined {
    let pathMatched = false;
    for (const r of this.routes) {
      const m = r.re.exec(pathname);
      if (!m) continue;
      pathMatched = true;
      if (r.method !== method) continue;
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { handler: r.handler, params };
    }
    return pathMatched ? 'method' : undefined;
  }
}

export const DEFAULT_BODY_LIMIT = 2 * 1024 * 1024;
export const UPLOAD_LIMIT = 25 * 1024 * 1024;

export function readBody(req: http.IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, `リクエストが大きすぎます(上限 ${Math.round(limit / 1024 / 1024)}MB)`)); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function parseJson(buf: Buffer): Record<string, unknown> {
  if (buf.length === 0) return {};
  let v: unknown;
  try { v = JSON.parse(buf.toString('utf8')); } catch { throw new HttpError(400, 'JSONとして解釈できません'); }
  if (v === null || typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, 'リクエストはJSONオブジェクトで送ってください');
  return v as Record<string, unknown>;
}

export interface MultipartFile { name: string; filename: string; data: Buffer }
export function parseMultipart(body: Buffer, contentType: string): { fields: Record<string, string>; files: MultipartFile[] } {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!m) throw new HttpError(400, 'multipart/form-data で送ってください');
  const delim = Buffer.from(`--${m[1] ?? m[2]}`);
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];
  let pos = body.indexOf(delim);
  while (pos !== -1) {
    const start = pos + delim.length;
    if (body.subarray(start, start + 2).toString() === '--') break;
    const next = body.indexOf(delim, start);
    if (next === -1) break;
    const part = body.subarray(start + 2, next - 2); // 先頭と末尾の CRLF を除く
    const headEnd = part.indexOf('\r\n\r\n');
    if (headEnd !== -1) {
      const head = part.subarray(0, headEnd).toString('utf8');
      const data = part.subarray(headEnd + 4);
      const name = /name="([^"]*)"/i.exec(head)?.[1] ?? '';
      const filename = /filename="([^"]*)"/i.exec(head)?.[1];
      if (filename !== undefined) files.push({ name, filename, data });
      else fields[name] = data.toString('utf8');
    }
    pos = next;
  }
  return { fields, files };
}
