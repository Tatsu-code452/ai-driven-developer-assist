// データモデル設計書 v2 に基づくエンティティ定義と入力検証
import { HttpError } from './errors.ts';

export const COLLECTIONS = {
  projects: 'projects',
  contexts: 'contexts',
  'work-items': 'workItems',
  prompts: 'prompts',
  executions: 'executions',
  artifacts: 'artifacts',
  traceability: 'traces',
  repositories: 'repositories',
  branches: 'branches',
  'pull-requests': 'pullRequests',
  releases: 'releases',
} as const;
export type CollKey = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
export const COLL_KEYS = Object.values(COLLECTIONS) as CollKey[];

export interface Rec {
  id: string;
  createdAt: string;
  updatedAt: string;
  [k: string]: unknown;
}

// 採番規則(データモデル設計書 7章)
export const PREFIX: Record<CollKey, string> = {
  projects: 'PRJ', contexts: 'CTX', workItems: 'TSK', prompts: 'PRM', executions: 'EXE', artifacts: 'ART',
  traces: 'TRC', repositories: 'REP', branches: 'BRN', pullRequests: 'PRQ', releases: 'REL',
};
export const WI_PREFIX: Record<string, string> = { TASK: 'TSK', BUG: 'BUG', QA: 'QAA', REVIEW: 'RVW', FIX: 'FIX' };

interface Rule {
  t: 'string' | 'string[]' | 'boolean' | 'number';
  req?: boolean;
  enum?: readonly string[];
  def?: unknown;
  /** サーバー管理項目。クライアントからは変更できない */
  ro?: boolean;
  /** 作成時のみ指定できる */
  fixed?: boolean;
}
const str = (o: Partial<Rule> = {}): Rule => ({ t: 'string', ...o });
const arr = (): Rule => ({ t: 'string[]' });
const bool = (def = false, o: Partial<Rule> = {}): Rule => ({ t: 'boolean', def, ...o });

export const ENUMS = {
  projectStatus: ['PLANNING', 'ACTIVE', 'DONE'],
  contextType: ['REQUIREMENT', 'DESIGN', 'TEST', 'SOURCE', 'PROJECT', 'KNOWLEDGE'],
  wiType: ['TASK', 'BUG', 'QA', 'REVIEW', 'FIX'],
  wiStatus: ['OPEN', 'TODO', 'DOING', 'DONE', 'CLOSED'],
  priority: ['HIGH', 'MEDIUM', 'LOW'],
  role: ['PM', 'REQ', 'ARCH', 'DB', 'UI', 'DES', 'BE', 'FE', 'TEST', 'REVIEW'],
  aiType: ['COPILOT', 'GITHUB_COPILOT', 'GEMINI'],
  artifactType: ['REQUIREMENT', 'DESIGN', 'SCREEN', 'DATABASE', 'API', 'SOURCE', 'TEST', 'MANUAL', 'REVIEW', 'FIX', 'WBS', 'PROMPT'],
  artifactStatus: ['DRAFT', 'REVIEW', 'APPROVED', 'BASELINE'],
  origin: ['MANUAL', 'CONVERTED', 'AI'],
  relation: ['INPUT', 'OUTPUT', 'DERIVED_FROM', 'IMPLEMENTS', 'VALIDATES', 'REVIEWS', 'FIXES'],
  prStatus: ['OPEN', 'REVIEWING', 'MERGED', 'CLOSED'],
} as const;

const pid = () => str({ req: true, fixed: true });

export const SCHEMAS: Record<CollKey, Record<string, Rule>> = {
  projects: {
    name: str({ req: true }), description: str(),
    status: str({ req: true, enum: ENUMS.projectStatus, def: 'PLANNING' }), rootPath: str({ req: true }),
  },
  contexts: {
    projectId: pid(), title: str({ req: true }), type: str({ req: true, enum: ENUMS.contextType }),
    content: str({ req: true }), sourceArtifactIds: arr(), tags: arr(),
  },
  workItems: {
    projectId: pid(), type: str({ req: true, enum: ENUMS.wiType, fixed: true }), title: str({ req: true }), description: str(),
    status: str({ enum: ENUMS.wiStatus, def: 'TODO' }), priority: str({ enum: ENUMS.priority, def: 'MEDIUM' }),
    assignee: str(), parentId: str(), answer: str(), isKnowledge: bool(),
  },
  prompts: {
    projectId: pid(), name: str({ req: true }), role: str({ req: true, enum: ENUMS.role }),
    template: str({ req: true }), outputFormat: str(), version: str({ def: '1.0' }),
  },
  executions: {
    projectId: pid(), workItemId: str(), promptId: str(), contextIds: arr(), requestText: str({ req: true }),
    responseText: str(), executedAt: str({ def: () => new Date().toISOString() }), aiType: str({ req: true, enum: ENUMS.aiType }),
  },
  artifacts: {
    projectId: pid(), workItemId: str(), artifactType: str({ req: true, enum: ENUMS.artifactType }), title: str({ req: true }),
    path: str(), content: str(), status: str({ enum: ENUMS.artifactStatus, def: 'DRAFT' }), origin: str({ enum: ENUMS.origin, def: 'MANUAL', fixed: true }),
    reviewNote: str(), approved: bool(false, { ro: true }), version: { t: 'number', def: 1, ro: true },
  },
  traces: {
    projectId: pid(), sourceType: str(), sourceId: str({ req: true }), targetType: str(), targetId: str({ req: true }),
    relationType: str({ req: true, enum: ENUMS.relation }),
  },
  repositories: {
    projectId: pid(), url: str({ req: true }), defaultBranch: str({ req: true, def: 'main' }), currentBranch: str(), worktreeRoot: str(),
  },
  branches: {
    projectId: pid(), repositoryId: str({ req: true, fixed: true }), name: str({ req: true }), baseBranch: str({ def: 'main' }), worktreePath: str(),
  },
  pullRequests: {
    projectId: pid(), repositoryId: str({ req: true, fixed: true }), title: str({ req: true }), description: str(),
    sourceBranch: str({ req: true }), targetBranch: str({ def: 'main' }), status: str({ enum: ENUMS.prStatus, def: 'OPEN' }), reviewNote: str(), mergedAt: str({ ro: true }),
  },
  releases: {
    projectId: pid(), repositoryId: str({ req: true, fixed: true }), tag: str({ req: true }), note: str(), releasedAt: str({ def: () => new Date().toISOString() }),
  },
};

const emptyOf = (t: Rule['t']): unknown => (t === 'string[]' ? [] : t === 'boolean' ? false : t === 'number' ? 0 : '');

/** 入力を検証し、スキーマにある項目だけを取り出す。誤りがあれば 400 */
export function validate(k: CollKey, input: Record<string, unknown>, mode: 'create' | 'update'): Record<string, unknown> {
  const errors: string[] = [];
  const out: Record<string, unknown> = {};
  for (const [name, rule] of Object.entries(SCHEMAS[k])) {
    const given = Object.prototype.hasOwnProperty.call(input, name) && input[name] !== undefined;
    if (mode === 'update' && (rule.ro || rule.fixed)) continue;
    if (mode === 'create' && rule.ro) {
      out[name] = typeof rule.def === 'function' ? rule.def() : rule.def ?? emptyOf(rule.t);
      continue;
    }
    if (!given) {
      if (mode === 'update') continue;
      if (rule.def !== undefined) out[name] = typeof rule.def === 'function' ? (rule.def as () => unknown)() : rule.def;
      else if (rule.req) errors.push(`${name} は必須です`);
      else out[name] = emptyOf(rule.t);
      continue;
    }
    const v = input[name];
    const ok =
      rule.t === 'string' ? typeof v === 'string'
      : rule.t === 'boolean' ? typeof v === 'boolean'
      : rule.t === 'number' ? typeof v === 'number' && Number.isFinite(v)
      : Array.isArray(v) && v.every((x) => typeof x === 'string');
    if (!ok) { errors.push(`${name} の型が不正です(${rule.t})`); continue; }
    if (rule.req && rule.t === 'string' && !(v as string).trim()) { errors.push(`${name} は必須です`); continue; }
    if (rule.enum && !rule.enum.includes(v as string)) { errors.push(`${name} は ${rule.enum.join(' / ')} のいずれかです`); continue; }
    out[name] = rule.t === 'string' ? (v as string) : v;
  }
  if (errors.length) throw new HttpError(400, '入力内容に誤りがあります', errors);
  return out;
}

/** コレクション名 → APIパス(= 案件フォルダ内のファイル名の語幹) */
export const SEGMENT_OF = Object.fromEntries(Object.entries(COLLECTIONS).map(([seg, k]) => [k, seg])) as Record<CollKey, string>;
