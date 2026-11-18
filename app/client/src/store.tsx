import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type {
  AIExecution, Artifact, Base, Branch, Context, Project, PullRequest, Prompt,
  Release, Repository, Traceability, WorkItem,
} from './types';
import { SEGMENTS, fetchAll, http } from './api';
import { useToast } from './toast';
import { errMsg } from './util';

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

const KEYS = Object.keys(SEGMENTS) as CollectionKey[];
const emptyData = (): Data => Object.fromEntries(KEYS.map((k) => [k, []])) as unknown as Data;
// 作業中プロジェクトはUIの状態なのでブラウザに保存する(業務データはサーバーが持つ)
const CURRENT_KEY = 'aidda-client:currentProject';

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

type Status = 'loading' | 'ready' | 'error';

interface Store {
  status: Status;
  error: string;
  data: Data;
  /** 選択中プロジェクトのデータのみ(projectsは全件) */
  scoped: Data;
  currentProject: Project | undefined;
  setCurrentProject: (id: string) => void;
  /** 以下の更新系はサーバーへ送信し、失敗時はトーストを出して undefined / false を返す(例外は投げない) */
  add: <K extends CollectionKey>(k: K, v: NewOf<K>) => Promise<Collections[K] | undefined>;
  update: <K extends CollectionKey>(k: K, id: string, patch: Partial<NewOf<K>>) => Promise<Collections[K] | undefined>;
  remove: (k: CollectionKey, id: string) => Promise<boolean>;
  /** 個別エンドポイント(ワークフロー等)を呼び、サーバー側で変わったデータを再読込する */
  call: <T>(method: string, path: string, body?: unknown) => Promise<T | undefined>;
  addDefaultPrompts: (projectId: string) => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [data, setData] = useState<Data>(emptyData);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [currentId, setCurrentId] = useState(() => {
    try { return localStorage.getItem(CURRENT_KEY) ?? ''; } catch { return ''; }
  });

  // 初回読込が済んだか。状態更新関数の中で副作用(トースト)を出さないため ref で持つ
  const loadedRef = useRef(false);
  const reload = useCallback(async () => {
    if (!loadedRef.current) setStatus('loading');
    try {
      const entries = await Promise.all(KEYS.map(async (k) => [k, await fetchAll(SEGMENTS[k])] as const));
      setData(Object.fromEntries(entries) as unknown as Data);
      loadedRef.current = true;
      setStatus('ready');
      setError('');
    } catch (e) {
      if (loadedRef.current) {
        toast(`データの再読込に失敗しました: ${errMsg(e)}`, 'bad');
      } else {
        setError(errMsg(e));
        setStatus('error');
      }
    }
  }, [toast]);

  useEffect(() => { void reload(); }, [reload]);

  const add = useCallback(async <K extends CollectionKey>(k: K, v: NewOf<K>) => {
    try {
      const item = await http<Collections[K]>('POST', `/api/${SEGMENTS[k]}`, v);
      setData((d) => ({ ...d, [k]: [...(d[k] as Collections[K][]), item] }) as Data);
      return item;
    } catch (e) {
      toast(errMsg(e), 'bad');
      return undefined;
    }
  }, [toast]);

  const update = useCallback(async <K extends CollectionKey>(k: K, id: string, patch: Partial<NewOf<K>>) => {
    try {
      const item = await http<Collections[K]>('PATCH', `/api/${SEGMENTS[k]}/${encodeURIComponent(id)}`, patch);
      setData((d) => ({ ...d, [k]: (d[k] as Collections[K][]).map((x) => (x.id === id ? item : x)) }) as Data);
      return item;
    } catch (e) {
      toast(errMsg(e), 'bad');
      return undefined;
    }
  }, [toast]);

  const remove = useCallback(async (k: CollectionKey, id: string) => {
    try {
      await http<void>('DELETE', `/api/${SEGMENTS[k]}/${encodeURIComponent(id)}`);
      await reload(); // 関連データ(トレーサビリティ・配下のデータ)もサーバー側で消えるため再読込する
      return true;
    } catch (e) {
      toast(errMsg(e), 'bad');
      return false;
    }
  }, [toast, reload]);

  const call = useCallback(async <T,>(method: string, path: string, body?: unknown) => {
    try {
      const r = await http<T>(method, path, body ?? {});
      await reload();
      return r;
    } catch (e) {
      toast(errMsg(e), 'bad');
      return undefined;
    }
  }, [toast, reload]);

  const addDefaultPrompts = useCallback(async (projectId: string) => {
    for (const p of DEFAULT_PROMPTS) await add('prompts', { ...p, projectId });
  }, [add]);

  // 選択中のIDが無効(未選択/削除済み)なら先頭のプロジェクトを使う
  const currentProject = data.projects.find((p) => p.id === currentId) ?? data.projects[0];
  const setCurrentProject = useCallback((id: string) => {
    setCurrentId(id);
    try { localStorage.setItem(CURRENT_KEY, id); } catch { /* 保存できなくても動作する */ }
  }, []);

  const scoped = useMemo(() => {
    const out: Record<string, unknown[]> = {};
    for (const k of KEYS) {
      out[k] = (data[k] as { id: string; projectId?: string }[]).filter((x) => k === 'projects' || x.projectId === currentProject?.id);
    }
    return out as unknown as Data;
  }, [data, currentProject?.id]);

  const value = useMemo<Store>(
    () => ({ status, error, data, scoped, currentProject, setCurrentProject, add, update, remove, call, addDefaultPrompts, reload }),
    [status, error, data, scoped, currentProject, setCurrentProject, add, update, remove, call, addDefaultPrompts, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
