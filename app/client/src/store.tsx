import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type {
  AIExecution, Artifact, Base, Branch, Context, Project, PullRequest, Prompt,
  Release, Repository, Traceability, WorkItem, WorkItemType,
} from './types';

export interface Collections {
  projects: Project;
  contexts: Context;
  workItems: WorkItem;
  prompts: Prompt;
  executions: AIExecution;
  artifacts: Artifact;
  traces: Traceability;
  repositories: Repository;
  branches: Branch;
  pullRequests: PullRequest;
  releases: Release;
}
export type CollectionKey = keyof Collections;
export type NewOf<K extends CollectionKey> = Omit<Collections[K], keyof Base>;
export type Data = { [K in CollectionKey]: Collections[K][] };

interface DB {
  data: Data;
  counters: Record<string, number>;
  currentProjectId: string;
}

const STORAGE_KEY = 'aidda-client:v1';

// 採番規則(データモデル設計書 7章)
const PREFIX: Record<CollectionKey, string> = {
  projects: 'PRJ', contexts: 'CTX', workItems: 'TSK', prompts: 'PRM', executions: 'EXE',
  artifacts: 'ART', traces: 'TRC', repositories: 'REP', branches: 'BRN', pullRequests: 'PRQ', releases: 'REL',
};
const WI_PREFIX: Record<WorkItemType, string> = {
  TASK: 'TSK', BUG: 'BUG', QA: 'QAA', REVIEW: 'RVW', FIX: 'FIX',
};

const emptyData = (): Data => ({
  projects: [], contexts: [], workItems: [], prompts: [], executions: [], artifacts: [],
  traces: [], repositories: [], branches: [], pullRequests: [], releases: [],
});

function addTo<K extends CollectionKey>(db: DB, k: K, v: NewOf<K>): [DB, Collections[K]] {
  const prefix = k === 'workItems' ? WI_PREFIX[(v as unknown as NewOf<'workItems'>).type] : PREFIX[k];
  const n = (db.counters[prefix] ?? 0) + 1;
  const now = new Date().toISOString();
  const item = {
    ...v,
    id: `${prefix}-${String(n).padStart(3, '0')}`,
    createdAt: now,
    updatedAt: now,
  } as unknown as Collections[K];
  const list = db.data[k] as Collections[K][];
  return [
    { ...db, counters: { ...db.counters, [prefix]: n }, data: { ...db.data, [k]: [...list, item] } as Data },
    item,
  ];
}

export const DEFAULT_PROMPTS: Omit<NewOf<'prompts'>, 'projectId'>[] = [
  {
    name: '要件分析', role: 'REQ', version: '1.0',
    template: 'あなたは{{role}}担当です。以下のコンテキストを分析し、タスクを実施してください。\n\n## タスク\n{{task}}\n\n## コンテキスト\n{{contexts}}\n\n## 出力形式\n{{outputFormat}}',
    outputFormat: 'Markdown(見出し付き・箇条書き中心)',
  },
  {
    name: '設計書作成', role: 'ARCH', version: '1.0',
    template: 'あなたは{{role}}です。要件コンテキストをもとに設計書を作成してください。\n\n## タスク\n{{task}}\n\n## 要件コンテキスト\n{{contexts}}\n\n## 出力形式\n{{outputFormat}}',
    outputFormat: 'Markdown(見出し付き・箇条書き中心)',
  },
  {
    name: 'テスト仕様作成', role: 'TEST', version: '1.0',
    template: 'あなたは{{role}}担当です。設計コンテキストをもとにテスト仕様を作成してください。\n\n## タスク\n{{task}}\n\n## 設計コンテキスト\n{{contexts}}\n\n## 出力形式\n{{outputFormat}}',
    outputFormat: '表形式(Markdownテーブル)',
  },
];

function seed(): DB {
  let db: DB = { data: emptyData(), counters: {}, currentProjectId: '' };
  const r = addTo(db, 'projects', {
    name: 'サンプルプロジェクト', description: '動作確認用のサンプルです。不要になったら削除してください。',
    status: 'ACTIVE', rootPath: './datas',
  });
  db = { ...r[0], currentProjectId: r[1].id };
  for (const p of DEFAULT_PROMPTS) db = addTo(db, 'prompts', { ...p, projectId: r[1].id })[0];
  return db;
}

function load(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as DB;
      if (p?.data) return { ...p, data: { ...emptyData(), ...p.data } };
    }
  } catch {
    /* 破損データは無視して初期化 */
  }
  return seed();
}

interface Store {
  data: Data;
  /** 選択中プロジェクトのデータのみ(projectsは全件) */
  scoped: Data;
  currentProject: Project | undefined;
  setCurrentProject: (id: string) => void;
  add: <K extends CollectionKey>(k: K, v: NewOf<K>) => Collections[K];
  update: <K extends CollectionKey>(k: K, id: string, patch: Partial<NewOf<K>>) => void;
  remove: (k: CollectionKey, id: string) => void;
  addDefaultPrompts: (projectId: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const ref = useRef(db);
  const commit = useCallback((next: DB) => {
    ref.current = next;
    setDb(next);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* 容量超過などは無視 */
    }
  }, [db]);

  const add = useCallback(
    <K extends CollectionKey>(k: K, v: NewOf<K>) => {
      const [next, item] = addTo(ref.current, k, v);
      commit(next);
      return item;
    },
    [commit],
  );

  const update = useCallback(
    <K extends CollectionKey>(k: K, id: string, patch: Partial<NewOf<K>>) => {
      const cur = ref.current;
      const now = new Date().toISOString();
      const list = (cur.data[k] as Collections[K][]).map((x) =>
        x.id === id ? ({ ...x, ...patch, updatedAt: now } as Collections[K]) : x,
      );
      commit({ ...cur, data: { ...cur.data, [k]: list } as Data });
    },
    [commit],
  );

  const remove = useCallback(
    (k: CollectionKey, id: string) => {
      const cur = ref.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = { ...cur.data } as unknown as Record<string, any[]>;
      d[k] = d[k].filter((x) => x.id !== id);
      d.traces = d.traces.filter((t) => t.sourceId !== id && t.targetId !== id);
      if (k === 'projects') {
        for (const key of Object.keys(d)) if (key !== 'projects') d[key] = d[key].filter((x) => x.projectId !== id);
      }
      if (k === 'repositories') {
        for (const key of ['branches', 'pullRequests', 'releases']) d[key] = d[key].filter((x) => x.repositoryId !== id);
      }
      let currentProjectId = cur.currentProjectId;
      if (k === 'projects' && currentProjectId === id) currentProjectId = d.projects[0]?.id ?? '';
      commit({ ...cur, data: d as unknown as Data, currentProjectId });
    },
    [commit],
  );

  const setCurrentProject = useCallback((id: string) => commit({ ...ref.current, currentProjectId: id }), [commit]);

  const addDefaultPrompts = useCallback(
    (projectId: string) => {
      let next = ref.current;
      for (const p of DEFAULT_PROMPTS) next = addTo(next, 'prompts', { ...p, projectId })[0];
      commit(next);
    },
    [commit],
  );

  const resetAll = useCallback(() => commit(seed()), [commit]);

  const scoped = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any[]> = {};
    for (const k of Object.keys(db.data) as CollectionKey[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      out[k] = (db.data[k] as any[]).filter((x) => k === 'projects' || x.projectId === db.currentProjectId);
    }
    return out as unknown as Data;
  }, [db]);

  const value = useMemo<Store>(
    () => ({
      data: db.data,
      scoped,
      currentProject: db.data.projects.find((p) => p.id === db.currentProjectId),
      setCurrentProject, add, update, remove, addDefaultPrompts, resetAll,
    }),
    [db, scoped, setCurrentProject, add, update, remove, addDefaultPrompts, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
