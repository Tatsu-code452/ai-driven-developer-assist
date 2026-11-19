import path from 'node:path';

export interface AiEndpoint { url: string; key: string; model: string }
export interface Config {
  port: number;
  dataDir: string;
  workspaceRoot: string;
  corsOrigin: string;
  apiToken: string;
  gemini: { key: string; model: string; baseUrl: string };
  copilot: AiEndpoint;
  githubCopilot: AiEndpoint;
  git: { userName: string; userEmail: string };
  /** メモリに常駐させる案件データの上限(超えると最近使っていない案件から手放す。インデックスは常に常駐) */
  maxLoadedProjects: number;
  /** 監査ログ(audit.jsonl)がこのサイズを超えたら新しいファイルに切り替える */
  auditMaxBytes: number;
  /** 切り替え後の旧ログ(audit.<日時>.jsonl)を残す世代数。古いものから削除する。0 なら削除しない */
  auditKeepFiles: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const ep = (p: string): AiEndpoint => ({ url: env[`${p}_API_URL`] ?? '', key: env[`${p}_API_KEY`] ?? '', model: env[`${p}_MODEL`] ?? '' });
  return {
    port: Number(env.PORT ?? 8080),
    dataDir: path.resolve(env.DATA_DIR ?? './data'),
    workspaceRoot: path.resolve(env.GIT_WORKSPACE_ROOT ?? './workspaces'),
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
    apiToken: env.API_TOKEN ?? '',
    gemini: {
      key: env.GEMINI_API_KEY ?? '',
      model: env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      baseUrl: env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    },
    copilot: ep('COPILOT'),
    githubCopilot: ep('GITHUB_COPILOT'),
    git: { userName: env.GIT_USER_NAME ?? 'AI Dev Assist', userEmail: env.GIT_USER_EMAIL ?? 'ai-dev-assist@localhost' },
    maxLoadedProjects: Number(env.MAX_LOADED_PROJECTS ?? 20),
    auditMaxBytes: Number(env.AUDIT_MAX_BYTES ?? 5 * 1024 * 1024),
    auditKeepFiles: Number(env.AUDIT_KEEP_FILES ?? 10),
  };
}
