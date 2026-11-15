// バックエンドAPI連携。サーバー未接続でも画面操作自体は localStorage で完結する。
import type { AIType, Repository } from './types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new Error('サーバーに接続できません。バックエンドの起動状況と VITE_API_BASE を確認してください。');
  }
  if (!res.ok) throw new Error(`サーバーがエラーを返しました (${res.status})`);
  return (await res.json()) as T;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** ブラウザだけで読めるテキスト系拡張子 */
const TEXT_EXT = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'yaml', 'yml', 'xml', 'html', 'log'];
export const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
export const isLocallyReadable = (file: File) => TEXT_EXT.includes(extOf(file.name));

/** F-003-001〜003: PDF/Word/Excel → テキスト。POST /api/convert (multipart) → { text } */
export async function convertFile(file: File): Promise<string> {
  if (isLocallyReadable(file)) return file.text();
  const form = new FormData();
  form.append('file', file);
  const r = await request<{ text: string }>('/api/convert', { method: 'POST', body: form });
  return r.text;
}

/** F-007-001: AI呼出。POST /api/ai/execute { aiType, prompt } → { response } */
export async function executeAI(aiType: AIType, prompt: string): Promise<string> {
  const r = await request<{ response: string }>('/api/ai/execute', json({ aiType, prompt }));
  return r.response;
}

/** F-013-002: Fetch / Pull。POST /api/git/{fetch|pull} → { message } */
export async function gitAction(action: 'fetch' | 'pull', repo: Repository): Promise<string> {
  const r = await request<{ message?: string }>(
    `/api/git/${action}`,
    json({ repositoryId: repo.id, url: repo.url, worktreeRoot: repo.worktreeRoot }),
  );
  return r.message ?? `${action} が完了しました`;
}
