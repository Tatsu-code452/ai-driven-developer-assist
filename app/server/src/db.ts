import fs from 'node:fs';
import path from 'node:path';
import { HttpError } from './errors.ts';
import { COLL_KEYS, PREFIX, WI_PREFIX, validate, type CollKey, type Rec } from './schemas.ts';

export interface AuditEntry { id: string; at: string; action: string; collection: string; entityId: string; detail?: string }
interface Persisted {
  data: Record<CollKey, Rec[]>;
  counters: Record<string, number>;
  audit: AuditEntry[];
  settings: Record<string, string>;
}

const AUDIT_LIMIT = 5000;
const now = () => new Date().toISOString();

/** JSONファイルに保存する簡易ストア(単一プロセス前提)。書き込みは一時ファイル+renameで原子的に行う */
export class Database {
  file: string;
  data: Record<CollKey, Rec[]>;
  counters: Record<string, number>;
  audit: AuditEntry[];
  settings: Record<string, string>;

  constructor(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, 'db.json');
    const empty = Object.fromEntries(COLL_KEYS.map((k) => [k, [] as Rec[]])) as Record<CollKey, Rec[]>;
    let p: Partial<Persisted> = {};
    if (fs.existsSync(this.file)) p = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<Persisted>;
    this.data = { ...empty, ...(p.data ?? {}) };
    this.counters = p.counters ?? {};
    this.audit = p.audit ?? [];
    this.settings = p.settings ?? {};
  }

  save(): void {
    const tmp = `${this.file}.${process.pid}.tmp`;
    const body: Persisted = { data: this.data, counters: this.counters, audit: this.audit, settings: this.settings };
    fs.writeFileSync(tmp, JSON.stringify(body, null, 2));
    fs.renameSync(tmp, this.file);
  }

  list(k: CollKey): Rec[] { return this.data[k]; }
  get(k: CollKey, id: string): Rec | undefined { return this.data[k].find((x) => x.id === id); }
  require(k: CollKey, id: string, label = 'データ'): Rec {
    const r = this.get(k, id);
    if (!r) throw new HttpError(404, `${label} ${id} が見つかりません`);
    return r;
  }
  /** 全コレクションからIDで探す(トレーサビリティ用) */
  find(id: string): { k: CollKey; rec: Rec } | undefined {
    for (const k of COLL_KEYS) {
      const rec = this.get(k, id);
      if (rec) return { k, rec };
    }
    return undefined;
  }

  log(action: string, collection: string, entityId: string, detail?: string): void {
    const n = (this.counters.AUD ?? 0) + 1;
    this.counters.AUD = n;
    this.audit.push({ id: `AUD-${String(n).padStart(5, '0')}`, at: now(), action, collection, entityId, ...(detail ? { detail } : {}) });
    if (this.audit.length > AUDIT_LIMIT) this.audit.splice(0, this.audit.length - AUDIT_LIMIT);
  }

  private checkRefs(k: CollKey, v: Record<string, unknown>, selfId?: string): void {
    const projectId = v.projectId as string | undefined;
    if (projectId !== undefined && !this.get('projects', projectId)) throw new HttpError(400, `projectId ${projectId} のプロジェクトが存在しません`);
    const repositoryId = v.repositoryId as string | undefined;
    if (repositoryId !== undefined && !this.get('repositories', repositoryId)) throw new HttpError(400, `repositoryId ${repositoryId} のリポジトリが存在しません`);
    if (k === 'workItems' && v.parentId) {
      if (v.parentId === selfId) throw new HttpError(400, '自分自身を親にはできません');
      if (!this.get('workItems', v.parentId as string)) throw new HttpError(400, `parentId ${v.parentId} が存在しません`);
    }
    if (k === 'traces') {
      for (const f of ['sourceId', 'targetId']) {
        if (v[f] !== undefined && !this.find(v[f] as string)) throw new HttpError(400, `${f} ${v[f]} に該当する項目がありません`);
      }
    }
  }

  private checkUnique(k: CollKey, v: Record<string, unknown>, selfId?: string): void {
    const others = this.data[k].filter((x) => x.id !== selfId);
    if (k === 'traces') {
      if (v.sourceId === v.targetId) throw new HttpError(400, '関連元と関連先に同じ項目は指定できません');
      if (others.some((x) => x.sourceId === v.sourceId && x.targetId === v.targetId && x.relationType === v.relationType)) throw new HttpError(409, '同じ関連付けが登録済みです');
    }
    if (k === 'releases' && others.some((x) => x.repositoryId === v.repositoryId && x.tag === v.tag)) throw new HttpError(409, `タグ ${v.tag} は登録済みです`);
  }

  create(k: CollKey, input: Record<string, unknown>): Rec {
    const v = validate(k, input, 'create');
    this.checkRefs(k, v);
    if (k === 'repositories' && !v.currentBranch) v.currentBranch = v.defaultBranch;
    if (k === 'artifacts') { v.versions = []; }
    // トレーサビリティの種別はサーバー側で決める(クライアントの申告に依存しない)
    if (k === 'traces') {
      v.sourceType = this.find(v.sourceId as string)?.k ?? '';
      v.targetType = this.find(v.targetId as string)?.k ?? '';
    }
    this.checkUnique(k, v);
    const prefix = k === 'workItems' ? WI_PREFIX[v.type as string] : PREFIX[k];
    const n = (this.counters[prefix] ?? 0) + 1;
    this.counters[prefix] = n;
    const t = now();
    const rec: Rec = { id: `${prefix}-${String(n).padStart(3, '0')}`, ...v, createdAt: t, updatedAt: t };
    this.data[k].push(rec);
    this.log('create', k, rec.id);
    this.save();
    return rec;
  }

  update(k: CollKey, id: string, input: Record<string, unknown>): Rec {
    const cur = this.require(k, id);
    const v = validate(k, input, 'update');
    this.checkRefs(k, v, id);
    this.checkUnique(k, { ...cur, ...v }, id);
    // 成果物は内容が変わったら版を上げ、旧内容を履歴に残す(F-008-005)
    if (k === 'artifacts' && typeof v.content === 'string' && v.content !== cur.content) {
      const versions = cur.versions as unknown[];
      v.versions = [...versions, { version: cur.version, content: cur.content, savedAt: cur.updatedAt }];
      v.version = (cur.version as number) + 1;
      v.status = 'DRAFT';
      v.approved = false;
    }
    Object.assign(cur, v, { updatedAt: now() });
    this.log('update', k, id, Object.keys(v).join(','));
    this.save();
    return cur;
  }

  /** 関連データも含めて削除する */
  remove(k: CollKey, id: string): void {
    this.require(k, id);
    const drop = (key: CollKey, pred: (r: Rec) => boolean) => { this.data[key] = this.data[key].filter((r) => !pred(r)); };
    drop(k, (r) => r.id === id);
    drop('traces', (r) => r.sourceId === id || r.targetId === id);
    if (k === 'workItems') for (const r of this.data.workItems) if (r.parentId === id) r.parentId = '';
    if (k === 'repositories') for (const key of ['branches', 'pullRequests', 'releases'] as CollKey[]) drop(key, (r) => r.repositoryId === id);
    if (k === 'projects') for (const key of COLL_KEYS) if (key !== 'projects') drop(key, (r) => r.projectId === id);
    this.log('delete', k, id);
    this.save();
  }
}
