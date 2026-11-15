// F-007-001 / C-008: AI連携基盤。AI種別ごとの接続先は環境変数で設定する
import type { AiEndpoint, Config } from './config.ts';
import { HttpError } from './errors.ts';

export type FetchFn = typeof fetch;
const TIMEOUT_MS = 120_000;

async function post(fetchFn: FetchFn, url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new HttpError(502, `AIサービスに接続できません: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!res.ok) throw new HttpError(502, `AIサービスがエラーを返しました (${res.status})`, (await res.text()).slice(0, 500));
  return res.json();
}

async function openAiCompatible(fetchFn: FetchFn, label: string, ep: AiEndpoint, envPrefix: string, prompt: string) {
  if (!ep.url || !ep.key) throw new HttpError(501, `${label} は未設定です。環境変数 ${envPrefix}_API_URL / ${envPrefix}_API_KEY(必要なら ${envPrefix}_MODEL)を設定してください`);
  const json = (await post(fetchFn, ep.url, { Authorization: `Bearer ${ep.key}` }, {
    ...(ep.model ? { model: ep.model } : {}), messages: [{ role: 'user', content: prompt }],
  })) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new HttpError(502, 'AIサービスの応答形式が想定と異なります');
  return { response: text, model: ep.model || 'default' };
}

export async function executeAI(cfg: Config, fetchFn: FetchFn, aiType: string, prompt: string): Promise<{ response: string; model: string }> {
  if (aiType === 'GEMINI') {
    if (!cfg.gemini.key) throw new HttpError(501, 'GEMINI は未設定です。環境変数 GEMINI_API_KEY を設定してください');
    const json = (await post(fetchFn, `${cfg.gemini.baseUrl}/models/${encodeURIComponent(cfg.gemini.model)}:generateContent`, { 'x-goog-api-key': cfg.gemini.key }, {
      contents: [{ parts: [{ text: prompt }] }],
    })) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    if (!text) throw new HttpError(502, 'Geminiの応答に本文がありません');
    return { response: text, model: cfg.gemini.model };
  }
  if (aiType === 'COPILOT') return openAiCompatible(fetchFn, 'COPILOT', cfg.copilot, 'COPILOT', prompt);
  if (aiType === 'GITHUB_COPILOT') return openAiCompatible(fetchFn, 'GITHUB_COPILOT', cfg.githubCopilot, 'GITHUB_COPILOT', prompt);
  throw new HttpError(400, `aiType は COPILOT / GITHUB_COPILOT / GEMINI のいずれかです`);
}
