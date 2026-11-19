// 案件1件ぶんの保存領域。案件フォルダの中身:
//   project.json        案件そのもの
//   <collection>.json   コレクションごとのデータ(contexts.json, work-items.json, ...)
//   index.json          検索・ID引き当て用のインデックス(データから再構築できる)
//   audit.jsonl         監査ログ(追記専用)
import path from 'node:path';
import { HttpError } from './errors.ts';
import { readJsonRecoverable, statOf, writeJsonAtomic } from './fsutil.ts';
import fs from 'node:fs';
import { COLL_KEYS, SEGMENT_OF, type CollKey, type Rec } from './schemas.ts';

export type PCollKey = Exclude<CollKey, 'projects'>;
export const PCOLLS = COLL_KEYS.filter((k): k is PCollKey => k !== 'projects');
export const fileOf = (k: PCollKey) => `${SEGMENT_OF[k]}.json`;
export const INDEX_VERSION = 1;
export const EXCERPT_LENGTH = 300;

/** 全文検索(deep)の対象項目 */
export const TEXT_FIELDS: Record<PCollKey, string[]> = {
  contexts: ['title', 'content'], workItems: ['title', 'description', 'answer'], artifacts: ['title', 'path', 'content'],
  prompts: ['name', 'template'], executions: ['requestText', 'responseText'], pullRequests: ['title', 'description', 'reviewNote'],
  releases: ['tag', 'note'], repositories: ['url'], branches: ['name'], traces: [],
};
const EXCERPT_FIELDS: Record<PCollKey, string[]> = {
  contexts: ['content'], workItems: ['description', 'answer'], artifacts: ['content', 'path'], prompts: ['template'],
  executions: ['responseText', 'requestText'], pullRequests: ['description'], releases: ['note'],
  repositories: [], branches: [], traces: [],
};

/** index.json の1項目。一覧・ID引き当て・タイトル/タグ/冒頭の検索に使う(本文全体は持たない) */
export interface IndexEntry {
  id: string;
  c: PCollKey;
  title: string;
  type: string;
  status: string;
  origin: string;
  tags: string[];
  updatedAt: string;
  excerpt: string;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

export function makeEntry(k: PCollKey, r: Rec): IndexEntry {
  const s = (f: string) => (typeof r[f] === 'string' ? (r[f] as string) : '');
  const e: IndexEntry = { id: r.id, c: k, title: '', type: '', status: '', origin: '', tags: [], updatedAt: r.updatedAt, excerpt: '' };
  switch (k) {
    case 'contexts': e.title = s('title'); e.type = s('type'); e.tags = Array.isArray(r.tags) ? (r.tags as string[]) : []; break;
    case 'workItems': e.title = s('title'); e.type = s('type'); e.status = s('status'); break;
    case 'artifacts': e.title = s('title'); e.type = s('artifactType'); e.status = s('status'); e.origin = s('origin'); break;
    case 'prompts': e.title = s('name'); e.type = s('role'); break;
    case 'executions': e.title = `AI実行 ${s('executedAt')}`; e.type = s('aiType'); break;
    case 'traces': e.title = `${s('sourceId')} → ${s('targetId')}`; e.type = s('relationType'); break;
    case 'repositories': e.title = s('url'); break;
    case 'branches': e.title = s('name'); break;
    case 'pullRequests': e.title = s('title'); e.status = s('status'); break;
    case 'releases': e.title = s('tag'); break;
  }
  e.excerpt = norm(EXCERPT_FIELDS[k].map(s).join(' ')).slice(0, EXCERPT_LENGTH);
  return e;
}

type FileStat = { size: number; mtimeMs: number };

export class ProjectStore {
  id: string;
  dir: string;
  record: Rec;
  /** 読み込み済みデータ。メモリ節約のため LRU で手放されることがある(書き込みは常に即時なので失われない) */
  data: Record<PCollKey, Rec[]> | undefined;
  entries = new Map<string, IndexEntry>();
  files: Record<string, FileStat> = {};
  lastUsed = 0;
  loadError = '';

  constructor(id: string, dir: string, record: Rec) {
    this.id = id;
    this.dir = dir;
    this.record = record;
  }

  path(name: string) { return path.join(this.dir, name); }

  writeProject(): void {
    writeJsonAtomic(this.path('project.json'), { schemaVersion: 2, project: this.record }, { backup: true });
  }

  /** 全コレクションを読む。壊れたファイルは .bak から復旧し、復旧できなければ 500(他の案件には影響しない) */
  ensureData(): Record<PCollKey, Rec[]> {
    if (this.data) return this.data;
    const d = {} as Record<PCollKey, Rec[]>;
    try {
      for (const k of PCOLLS) {
        const f = this.path(fileOf(k));
        const r = readJsonRecoverable<Rec[]>(f);
        if (r && !Array.isArray(r.value)) throw new Error(`${fileOf(k)} が配列ではありません`);
        d[k] = r?.value ?? [];
        if (r?.recovered) {
          console.warn(`[warn] ${this.id}/${fileOf(k)} をバックアップから復旧しました`);
          writeJsonAtomic(f, d[k], { backup: false });
        }
      }
    } catch (e) {
      this.loadError = e instanceof Error ? e.message : String(e);
      throw new HttpError(500, `案件 ${this.id} のデータを読み込めません: ${this.loadError}`);
    }
    this.loadError = '';
    this.data = d;
    return d;
  }
  unload(): void { this.data = undefined; }

  writeCollection(k: PCollKey): void {
    const f = this.path(fileOf(k));
    writeJsonAtomic(f, this.data![k], { backup: true });
    this.files[SEGMENT_OF[k]] = statOf(f);
  }

  writeIndex(): void {
    const counts: Record<string, number> = {};
    for (const e of this.entries.values()) counts[e.c] = (counts[e.c] ?? 0) + 1;
    writeJsonAtomic(this.path('index.json'), {
      schemaVersion: INDEX_VERSION, projectId: this.id, updatedAt: new Date().toISOString(),
      files: this.files, counts, entries: [...this.entries.values()],
    }, { pretty: false });
  }

  /** index.json を読む。無い/壊れている/データファイルと食い違う(外部で編集された等)なら false */
  loadIndex(): boolean {
    try {
      const f = this.path('index.json');
      if (!fs.existsSync(f)) return false;
      const idx = JSON.parse(fs.readFileSync(f, 'utf8')) as { schemaVersion: number; projectId: string; files: Record<string, FileStat>; entries: IndexEntry[] };
      if (idx.schemaVersion !== INDEX_VERSION || idx.projectId !== this.id || !Array.isArray(idx.entries)) return false;
      for (const k of PCOLLS) {
        const cur = statOf(this.path(fileOf(k)));
        const was = idx.files?.[SEGMENT_OF[k]];
        if (!was || was.size !== cur.size || was.mtimeMs !== cur.mtimeMs) return false;
      }
      this.entries = new Map(idx.entries.map((e) => [e.id, e]));
      this.files = idx.files;
      return true;
    } catch {
      return false;
    }
  }

  /** データファイルからインデックスを作り直す */
  rebuildIndex(): void {
    this.ensureData();
    this.entries = new Map();
    this.reindex(PCOLLS);
    for (const k of PCOLLS) this.files[SEGMENT_OF[k]] = statOf(this.path(fileOf(k)));
    this.writeIndex();
  }

  /** 指定コレクションのインデックス項目を作り直し、追加/削除されたIDを返す */
  reindex(keys: PCollKey[]): { added: string[]; removed: string[] } {
    const added: string[] = [];
    const removed: string[] = [];
    for (const k of keys) {
      const seen = new Set<string>();
      for (const rec of this.data![k]) {
        seen.add(rec.id);
        if (!this.entries.has(rec.id)) added.push(rec.id);
        this.entries.set(rec.id, makeEntry(k, rec));
      }
      for (const [id, e] of this.entries) {
        if (e.c === k && !seen.has(id)) { this.entries.delete(id); removed.push(id); }
      }
    }
    return { added, removed };
  }

  /** 変更のあったコレクションを書き出し、インデックスを更新する。keys の順に書くので、参照される側(トレーサビリティ等)を先に指定する */
  commit(keys: PCollKey[]): { added: string[]; removed: string[] } {
    try {
      for (const k of keys) this.writeCollection(k);
      const diff = this.reindex(keys);
      this.writeIndex();
      return diff;
    } catch (e) {
      this.data = undefined; // メモリとディスクの食い違いを残さない。次回アクセスでディスクから読み直す
      throw new HttpError(500, `案件 ${this.id} の保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  counts(): Record<string, number> {
    const c: Record<string, number> = {};
    for (const e of this.entries.values()) c[e.c] = (c[e.c] ?? 0) + 1;
    return c;
  }
}
