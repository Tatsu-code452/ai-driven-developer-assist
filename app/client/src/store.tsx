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
const PKEYS = KEYS.filter((k) => k !== 'projects');
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
  reload: (forceId?: string) => Promise<void>;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  // data.projects は全案件。それ以外のコレクションは「作業中の案件」のぶんだけを持つ(案件ごとにサーバー側のフォルダが分かれているため)
  const [data, setData] = useState<Data>(emptyData);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [currentId, setCurrentId] = useState(() => {
    try { return localStorage.getItem(CURRENT_KEY) ?? ''; } catch { return ''; }
  });
  const currentIdRef = useRef(currentId);
  const statusRef = useRef<Status>('loading');
  const seq = useRef(0);
  const changeStatus = useCallback((s: Status) => { statusRef.current = s; setStatus(s); }, []);

  /** プロジェクト一覧と、作業中プロジェクトのデータを読み直す。古い応答が新しい応答を上書きしないよう世代番号で破棄する */
  const reload = useCallback(async (forceId?: string) => {
    const mine = ++seq.current;
    try {
      const projects = await fetchAll<Project>(SEGMENTS.projects);
      const pid = (projects.find((p) => p.id === (forceId ?? currentIdRef.current)) ?? projects[0])?.id ?? '';
      const entries = await Promise.all(PKEYS.map(async (k) => [k, pid ? await fetchAll(SEGMENTS[k], pid) : []] as const));
      if (mine !== seq.current) return;
      currentIdRef.current = pid;
      setCurrentId(pid);
      setData({ projects, ...Object.fromEntries(entries) } as unknown as Data);
      setError('');
      changeStatus('ready');
    } catch (e) {
      if (mine !== seq.current) return;
      if (statusRef.current === 'ready') {
        toast(`データの再読込に失敗しました: ${errMsg(e)}`, 'bad');
      } else {
        setError(errMsg(e));
        changeStatus('error');
      }
    }
  }, [toast, changeStatus]);

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

  const currentProject = data.projects.find((p) => p.id === currentId);
  /** 作業中の案件を切り替える。切替後はその案件のデータを読み込む(他の案件のデータは読まない) */
  const setCurrentProject = useCallback((id: string) => {
    if (id === currentIdRef.current) return;
    currentIdRef.current = id;
    setCurrentId(id);
    try { localStorage.setItem(CURRENT_KEY, id); } catch { /* 保存できなくても動作する */ }
    changeStatus('loading');
    void reload(id);
  }, [reload, changeStatus]);

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
