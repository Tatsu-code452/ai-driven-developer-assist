// バックエンドAPI(server/)との通信。型は ./types の import type のみで、実行時の依存を持たない
import type { AIType, Repository } from './types';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const BASE = env.VITE_API_BASE ?? '';
// 注意: VITE_ の値はビルド成果物に埋め込まれる。共有トークンはローカル/社内利用の簡易認証として扱うこと
const TOKEN = env.VITE_API_TOKEN ?? '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const init: RequestInit = { method, headers };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiError(0, 'サーバーに接続できません。バックエンドの起動状況と VITE_API_BASE を確認してください。');
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let json: { error?: { message?: string; details?: unknown } } | undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    /* JSONでない応答(プロキシのエラーページなど) */
  }
  if (!res.ok) {
    const e = json?.error;
    const d = e?.details;
    const detail = Array.isArray(d) ? `: ${d.join(' / ')}` : typeof d === 'string' && d ? `\n${d}` : '';
    throw new ApiError(res.status, `${e?.message ?? `サーバーがエラーを返しました (${res.status})`}${detail}`);
  }
  return json as T;
}

/** クライアントのコレクション名 → APIのパス */
export const SEGMENTS = {
  projects: 'projects',
  contexts: 'contexts',
  workItems: 'work-items',
  prompts: 'prompts',
  executions: 'executions',
  artifacts: 'artifacts',
  traces: 'traceability',
  repositories: 'repositories',
  branches: 'branches',
  pullRequests: 'pull-requests',
  releases: 'releases',
} as const;

/** 全件取得(1000件ずつページング)。案件に属するデータは projectId が必須(サーバーは案件ごとのフォルダに保存している) */
export async function fetchAll<T>(segment: string, projectId?: string): Promise<T[]> {
  const out: T[] = [];
  const limit = 1000;
  for (let offset = 0; ; offset += limit) {
    const r = await http<{ items: T[]; total: number }>('GET', `/api/${segment}?limit=${limit}&offset=${offset}${projectId ? `&projectId=${encodeURIComponent(projectId)}` : ''}`);
    out.push(...r.items);
    if (out.length >= r.total || r.items.length === 0) break;
  }
  return out;
}

/** ブラウザだけで読めるテキスト系拡張子 */
const TEXT_EXT = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'yaml', 'yml', 'xml', 'html', 'log'];
export const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
export const isLocallyReadable = (file: File) => TEXT_EXT.includes(extOf(file.name));

/** F-003: PDF/Word/Excel → テキスト。テキスト系はブラウザ内で読む */
export async function convertFile(file: File): Promise<string> {
  if (isLocallyReadable(file)) return file.text();
  const form = new FormData();
  form.append('file', file);
  return (await http<{ text: string }>('POST', '/api/convert', form)).text;
}

/** F-007-001: AI呼出 */
export async function executeAI(aiType: AIType, prompt: string): Promise<string> {
  return (await http<{ response: string }>('POST', '/api/ai/execute', { aiType, prompt })).response;
}

/** F-013-002: Fetch / Pull */
export async function gitAction(action: 'fetch' | 'pull', repo: Repository): Promise<string> {
  const r = await http<{ message?: string }>('POST', `/api/git/${action}`, { repositoryId: repo.id, url: repo.url, worktreeRoot: repo.worktreeRoot });
  return r.message ?? `${action} が完了しました`;
}
