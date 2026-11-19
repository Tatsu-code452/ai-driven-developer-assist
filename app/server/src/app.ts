import crypto from 'node:crypto';
import http from 'node:http';
import type { Config } from './config.ts';
import { Database } from './db.ts';
import { HttpError } from './errors.ts';
import { DEFAULT_BODY_LIMIT, parseJson, readBody, type Ctx } from './http.ts';
import { buildRouter } from './routes.ts';

export function createApp(cfg: Config, deps: { fetch?: typeof fetch } = {}) {
  const db = new Database(cfg.dataDir, { maxLoadedProjects: cfg.maxLoadedProjects, auditMaxBytes: cfg.auditMaxBytes, auditKeepFiles: cfg.auditKeepFiles });
  const router = buildRouter(db, cfg, { fetch: deps.fetch ?? fetch });

  const send = (res: http.ServerResponse, status: number, body?: unknown) => {
    if (status === 204 || body === undefined) { res.writeHead(status).end(); return; }
    const data = JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }).end(data);
  };
  const tokenOk = (req: http.IncomingMessage) => {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
    if (!m) return false;
    const a = Buffer.from(m[1]);
    const b = Buffer.from(cfg.apiToken);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', cfg.corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      if (req.method === 'OPTIONS') return send(res, 204);
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (!url.pathname.startsWith('/api/')) throw new HttpError(404, 'API は /api 配下です');
      if (cfg.apiToken && url.pathname !== '/api/health' && !tokenOk(req)) throw new HttpError(401, '認証が必要です(Authorization: Bearer <token>)');
      const m = router.match(req.method ?? 'GET', url.pathname);
      if (!m) throw new HttpError(404, `${url.pathname} は存在しません`);
      if (m === 'method') throw new HttpError(405, `${req.method} は使えません`);
      let cached: Buffer | undefined;
      const buffer = async (limit = DEFAULT_BODY_LIMIT) => (cached ??= await readBody(req, limit));
      const ctx: Ctx = { req, url, params: m.params, query: url.searchParams, buffer, json: async () => parseJson(await buffer()) };
      const out = await m.handler(ctx);
      send(res, out.status ?? 200, out.body);
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: { message: e.message, ...(e.details !== undefined ? { details: e.details } : {}) } });
      console.error(e);
      send(res, 500, { error: { message: 'サーバー内部でエラーが発生しました' } });
    }
  });
  server.on('close', () => db.close());
  return { server, db };
}
