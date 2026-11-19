// 案件単位のフォルダをオーケストレートする保存層。
//   DATA_DIR/workspace.json     案件フォルダの一覧・採番カウンタ・設定(db.json の代わり)
//   DATA_DIR/projects/<ID>/     案件フォルダ(project-store.ts 参照)
//   DATA_DIR/trash/             削除した案件フォルダの退避先
//   DATA_DIR/audit.jsonl        案件に属さない操作の監査ログ
import fs from 'node:fs';
import path from 'node:path';
import { HttpError } from './errors.ts';
import { readJsonRecoverable, writeJsonAtomic } from './fsutil.ts';
import { PCOLLS, ProjectStore, fileOf, type PCollKey } from './project-store.ts';
import { PREFIX, WI_PREFIX, validate, type CollKey, type Rec } from './schemas.ts';

export interface AuditEntry { id: string; at: string; action: string; collection: string; entityId: string; detail?: string }
export interface ManifestProject { id: string; name: string; status: string; folder: string; createdAt: string; updatedAt: string }
interface Manifest {
  schemaVersion: number;
  updatedAt: string;
  counters: Record<string, number>;
  settings: Record<string, string>;
  projects: ManifestProject[];
}

const SCHEMA_VERSION = 2;
const now = () => new Date().toISOString();
const AUDIT_MIN_READ_BYTES = 2 * 1024 * 1024;
const ARCHIVE_RE = /^audit\.\d{8}T\d{9}Z-[0-9a-z]+\.jsonl$/;

export class Database {
  dataDir: string;
  maxLoaded: number;
  auditMaxBytes: number;
  auditKeepFiles: number;
  manifestFile: string;
  counters: Record<string, number> = {};
  settings: Record<string, string> = {};
  stores = new Map<string, ProjectStore>();
  /** エンティティID → 案件ID(全案件のindex.jsonから起動時に作る) */
  idMap = new Map<string, string>();
  unavailable: (ManifestProject & { reason: string })[] = [];
  private tick = 0;
  private auditSeq = 0;

  constructor(dataDir: string, opts: { maxLoadedProjects?: number; auditMaxBytes?: number; auditKeepFiles?: number } = {}) {
    this.dataDir = dataDir;
    this.maxLoaded = Math.max(1, opts.maxLoadedProjects ?? 20);
    this.auditMaxBytes = Math.max(1, opts.auditMaxBytes ?? 5 * 1024 * 1024);
    this.auditKeepFiles = Math.max(0, opts.auditKeepFiles ?? 10);
    this.manifestFile = path.join(dataDir, 'workspace.json');
    fs.mkdirSync(path.join(dataDir, 'projects'), { recursive: true });
    this.acquireLock();
    if (!this.migrateLegacy()) this.loadManifest();
    this.adoptOrphans();
    this.healCounters();
    this.saveManifest();
  }

  /* ---------- 起動・終了 ---------- */
  private lockFile() { return path.join(this.dataDir, '.lock'); }
  private acquireLock(): void {
    const f = this.lockFile();
    if (fs.existsSync(f)) {
      const pid = Number(fs.readFileSync(f, 'utf8'));
      let alive = false;
      if (pid && pid !== process.pid) {
        try { process.kill(pid, 0); alive = true; } catch (e) { alive = (e as NodeJS.ErrnoException).code === 'EPERM'; }
      }
      if (alive) throw new Error(`データディレクトリ ${this.dataDir} は別のプロセス(PID ${pid})が使用中です`);
    }
    fs.writeFileSync(f, String(process.pid));
  }
  close(): void {
    try {
      if (Number(fs.readFileSync(this.lockFile(), 'utf8')) === process.pid) fs.rmSync(this.lockFile());
    } catch { /* すでに無い */ }
  }

  private loadManifest(): void {
    let m: Manifest | undefined;
    try {
      m = readJsonRecoverable<Manifest>(this.manifestFile)?.value;
    } catch {
      console.warn('[warn] workspace.json が壊れています。案件フォルダから再構築します');
    }
    if (!m) return;
    this.counters = m.counters ?? {};
    this.settings = m.settings ?? {};
    for (const mp of m.projects ?? []) this.openProject(mp);
  }

  /** manifest に書かれた folder を DATA_DIR 配下に解決する(../ などで外に出る指定は拒否) */
  private resolveFolder(rel: string): string {
    const root = path.resolve(this.dataDir);
    const dir = path.resolve(root, rel);
    const r = path.relative(root, dir);
    if (!r || r.startsWith('..') || path.isAbsolute(r)) throw new Error(`案件フォルダ ${rel} がデータディレクトリの外を指しています`);
    return dir;
  }

  private openProject(mp: ManifestProject): void {
    const fail = (reason: string) => {
      console.warn(`[warn] 案件 ${mp.id} を読み込めません: ${reason}`);
      this.unavailable.push({ ...mp, reason });
    };
    let dir: string;
    try { dir = this.resolveFolder(mp.folder); } catch (e) { return fail((e as Error).message); }
    let rec: Rec | undefined;
    try {
      rec = readJsonRecoverable<{ project: Rec }>(path.join(dir, 'project.json'))?.value?.project;
    } catch (e) { return fail((e as Error).message); }
    if (!rec) return fail('案件フォルダまたは project.json がありません');
    if (rec.id !== mp.id) return fail(`project.json の ID(${rec.id})が一覧と一致しません`);
    if (this.stores.has(mp.id)) return fail('同じIDの案件が重複しています');
    const store = new ProjectStore(mp.id, dir, rec);
    if (!store.loadIndex()) {
      try { store.rebuildIndex(); console.log(`[info] ${mp.id} のインデックスを再構築しました`); } catch (e) { store.loadError = (e as Error).message; console.warn(`[warn] ${mp.id}: ${store.loadError}`); }
      this.enforceLimit(store);
    }
    this.register(store);
  }

  private register(store: ProjectStore): void {
    this.stores.set(store.id, store);
    for (const id of store.entries.keys()) this.idMap.set(id, store.id);
  }

  /** manifest に載っていない案件フォルダ(コピーして持ち込んだ等)を取り込む */
  private adoptOrphans(): void {
    const root = path.join(this.dataDir, 'projects');
    const known = new Set([...this.stores.values()].map((s) => s.dir).concat(this.unavailable.map((u) => { try { return this.resolveFolder(u.folder); } catch { return ''; } })));
    for (const name of fs.readdirSync(root)) {
      const dir = path.join(root, name);
      if (known.has(dir) || !fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, 'project.json'))) continue;
      try {
        const rec = readJsonRecoverable<{ project: Rec }>(path.join(dir, 'project.json'))?.value?.project;
        if (!rec?.id || this.stores.has(rec.id)) { console.warn(`[warn] projects/${name} は取り込めません(ID不明または重複)`); continue; }
        this.openProject({ id: rec.id, name: String(rec.name ?? ''), status: String(rec.status ?? ''), folder: `projects/${name}`, createdAt: rec.createdAt, updatedAt: rec.updatedAt });
        console.log(`[info] 案件フォルダ projects/${name} を取り込みました(${rec.id})`);
      } catch (e) { console.warn(`[warn] projects/${name}: ${(e as Error).message}`); }
    }
  }

  /** manifest が古い/失われても採番が既存IDと衝突しないよう、実在するIDの最大値まで引き上げる */
  private healCounters(): void {
    const bump = (id: string) => {
      const m = /^([A-Z]+)-(\d+)$/.exec(id);
      if (m && Number(m[2]) > (this.counters[m[1]] ?? 0)) this.counters[m[1]] = Number(m[2]);
    };
    for (const s of this.stores.values()) { bump(s.id); for (const id of s.entries.keys()) bump(id); }
  }

  /** 旧形式(単一の db.json)があれば案件フォルダ形式へ移行する。元ファイルは削除せず改名して残す */
  private migrateLegacy(): boolean {
    const legacy = path.join(this.dataDir, 'db.json');
    if (fs.existsSync(this.manifestFile) || !fs.existsSync(legacy)) return false;
    const old = JSON.parse(fs.readFileSync(legacy, 'utf8')) as { data: Record<string, Rec[]>; counters?: Record<string, number>; audit?: AuditEntry[]; settings?: Record<string, string> };
    this.counters = { ...(old.counters ?? {}) };
    delete this.counters.AUD;
    this.settings = old.settings ?? {};
    let orphans = 0;
    for (const proj of old.data.projects ?? []) {
      const dir = path.join(this.dataDir, 'projects', proj.id);
      const store = new ProjectStore(proj.id, dir, proj);
      store.data = Object.fromEntries(PCOLLS.map((k) => [k, (old.data[k] ?? []).filter((r) => r.projectId === proj.id)])) as Record<PCollKey, Rec[]>;
      store.writeProject();
      for (const k of PCOLLS) if (store.data[k].length) store.writeCollection(k);
      store.entries = new Map();
      store.reindex(PCOLLS);
      store.writeIndex();
      store.unload();
      this.register(store);
    }
    for (const k of PCOLLS) orphans += (old.data[k] ?? []).filter((r) => !this.stores.has(r.projectId as string)).length;
    if (orphans) console.warn(`[warn] 移行: 案件に属さないデータ ${orphans} 件は移行されません(db.json の退避ファイルに残っています)`);
    for (const a of old.audit ?? []) fs.appendFileSync(path.join(this.dataDir, 'audit.jsonl'), JSON.stringify(a) + '\n');
    this.saveManifest();
    fs.renameSync(legacy, `${legacy}.migrated`);
    console.log(`[info] db.json を案件フォルダ形式へ移行しました(元ファイル: db.json.migrated)`);
    return true;
  }

  saveManifest(): void {
    const m: Manifest = {
      schemaVersion: SCHEMA_VERSION, updatedAt: now(), counters: this.counters, settings: this.settings,
      projects: [
        ...[...this.stores.values()].map((s) => ({
          id: s.id, name: String(s.record.name), status: String(s.record.status),
          folder: path.relative(this.dataDir, s.dir).split(path.sep).join('/'), createdAt: s.record.createdAt, updatedAt: s.record.updatedAt,
        })),
        ...this.unavailable.map(({ reason: _r, ...mp }) => mp),
      ],
    };
    writeJsonAtomic(this.manifestFile, m, { backup: true });
  }

  /* ---------- メモリ管理(LRU) ---------- */
  private data(p: ProjectStore): Record<PCollKey, Rec[]> {
    const d = p.ensureData();
    p.lastUsed = ++this.tick;
    this.enforceLimit(p);
    return d;
  }
  private enforceLimit(keep: ProjectStore): void {
    const loaded = [...this.stores.values()].filter((s) => s.data);
    if (keep.data && !loaded.includes(keep)) loaded.push(keep);
    while (loaded.length > this.maxLoaded) {
      const victim = loaded.filter((s) => s !== keep).sort((a, b) => a.lastUsed - b.lastUsed)[0];
      if (!victim) break;
      victim.unload();
      loaded.splice(loaded.indexOf(victim), 1);
    }
  }
  loadedCount(): number { return [...this.stores.values()].filter((s) => s.data).length; }

  /* ---------- 参照 ---------- */
  allStores(): ProjectStore[] { return [...this.stores.values()]; }
  storeOf(projectId: string): ProjectStore {
    const p = this.stores.get(projectId);
    if (!p) throw new HttpError(404, `プロジェクト ${projectId} が見つかりません`);
    return p;
  }
  projectIdOf(id: string): string | undefined { return this.stores.has(id) ? id : this.idMap.get(id); }
  dataOf(p: ProjectStore): Record<PCollKey, Rec[]> { return this.data(p); }

  list(k: CollKey, projectId?: string): Rec[] {
    if (k === 'projects') return this.allStores().map((s) => s.record);
    if (!projectId) throw new HttpError(400, 'projectId を指定してください');
    return this.data(this.storeOf(projectId))[k as PCollKey];
  }
  get(k: CollKey, id: string): Rec | undefined {
    if (k === 'projects') return this.stores.get(id)?.record;
    const pid = this.idMap.get(id);
    const p = pid ? this.stores.get(pid) : undefined;
    if (!p || p.entries.get(id)?.c !== k) return undefined;
    return this.data(p)[k as PCollKey].find((r) => r.id === id);
  }
  require(k: CollKey, id: string, label = 'データ'): Rec {
    const r = this.get(k, id);
    if (!r) throw new HttpError(404, `${label} ${id} が見つかりません`);
    return r;
  }
  /** 全コレクションからIDで探す */
  find(id: string): { k: CollKey; rec: Rec } | undefined {
    const proj = this.stores.get(id);
    if (proj) return { k: 'projects', rec: proj.record };
    const pid = this.idMap.get(id);
    const p = pid ? this.stores.get(pid) : undefined;
    const e = p?.entries.get(id);
    if (!p || !e) return undefined;
    const rec = this.data(p)[e.c].find((r) => r.id === id);
    return rec ? { k: e.c, rec } : undefined;
  }

  /* ---------- 採番 ---------- */
  private nextId(prefix: string): string {
    const n = (this.counters[prefix] ?? 0) + 1;
    this.counters[prefix] = n;
    this.saveManifest(); // 先に採番を永続化する(途中で落ちても欠番になるだけで重複しない)
    return `${prefix}-${String(n).padStart(3, '0')}`;
  }

  /* ---------- 検証 ---------- */
  private checkRefs(p: ProjectStore, d: Record<PCollKey, Rec[]>, k: PCollKey, v: Record<string, unknown>, selfId?: string): void {
    if (v.repositoryId !== undefined && !d.repositories.some((r) => r.id === v.repositoryId)) {
      throw new HttpError(400, `repositoryId ${v.repositoryId} のリポジトリがこのプロジェクトにありません`);
    }
    if (k === 'workItems' && v.parentId) {
      if (v.parentId === selfId) throw new HttpError(400, '自分自身を親にはできません');
      if (!d.workItems.some((r) => r.id === v.parentId)) throw new HttpError(400, `parentId ${v.parentId} がこのプロジェクトにありません`);
    }
    if (k === 'traces') {
      for (const f of ['sourceId', 'targetId']) {
        const id = v[f] as string | undefined;
        if (id === undefined || p.entries.has(id) || id === p.id) continue;
        throw new HttpError(400, this.idMap.has(id) ? `${f} ${id} は別のプロジェクトの項目です(プロジェクトをまたぐ関連付けはできません)` : `${f} ${id} に該当する項目がありません`);
      }
    }
  }
  private checkUnique(d: Record<PCollKey, Rec[]>, k: PCollKey, v: Record<string, unknown>, selfId?: string): void {
    const others = d[k].filter((x) => x.id !== selfId);
    if (k === 'traces') {
      if (v.sourceId === v.targetId) throw new HttpError(400, '関連元と関連先に同じ項目は指定できません');
      if (others.some((x) => x.sourceId === v.sourceId && x.targetId === v.targetId && x.relationType === v.relationType)) throw new HttpError(409, '同じ関連付けが登録済みです');
    }
    if (k === 'releases' && others.some((x) => x.repositoryId === v.repositoryId && x.tag === v.tag)) throw new HttpError(409, `タグ ${v.tag} は登録済みです`);
  }

  private commit(p: ProjectStore, keys: PCollKey[]): void {
    const diff = p.commit(keys);
    for (const id of diff.added) this.idMap.set(id, p.id);
    for (const id of diff.removed) this.idMap.delete(id);
  }

  /* ---------- 更新 ---------- */
  create(k: CollKey, input: Record<string, unknown>): Rec {
    if (k === 'projects') return this.createProject(input);
    const key = k as PCollKey;
    const v = validate(k, input, 'create');
    const p = this.stores.get(v.projectId as string);
    if (!p) throw new HttpError(400, `projectId ${v.projectId} のプロジェクトが存在しません`);
    const d = this.data(p);
    this.checkRefs(p, d, key, v);
    if (key === 'repositories' && !v.currentBranch) v.currentBranch = v.defaultBranch;
    if (key === 'artifacts') v.versions = [];
    if (key === 'traces') { // 種別はサーバーが決める(クライアントの申告に依存しない)
      v.sourceType = (this.find(v.sourceId as string)?.k) ?? '';
      v.targetType = (this.find(v.targetId as string)?.k) ?? '';
    }
    this.checkUnique(d, key, v);
    const t = now();
    const rec: Rec = { id: this.nextId(key === 'workItems' ? WI_PREFIX[v.type as string] : PREFIX[k]), ...v, createdAt: t, updatedAt: t };
    d[key].push(rec);
    this.commit(p, [key]);
    this.appendAudit(p.id, { action: 'create', collection: k, entityId: rec.id });
    return rec;
  }

  private createProject(input: Record<string, unknown>): Rec {
    const v = validate('projects', input, 'create');
    const id = this.nextId('PRJ');
    const dir = path.join(this.dataDir, 'projects', id);
    if (fs.existsSync(dir)) throw new HttpError(500, `案件フォルダ projects/${id} が既に存在します`);
    const t = now();
    const store = new ProjectStore(id, dir, { id, ...v, createdAt: t, updatedAt: t });
    fs.mkdirSync(dir, { recursive: true });
    store.data = Object.fromEntries(PCOLLS.map((k) => [k, []])) as unknown as Record<PCollKey, Rec[]>;
    store.writeProject();
    for (const k of PCOLLS) store.writeCollection(k);
    store.writeIndex();
    this.register(store);
    this.saveManifest();
    this.enforceLimit(store);
    this.appendAudit(id, { action: 'create', collection: 'projects', entityId: id });
    return store.record;
  }

  update(k: CollKey, id: string, input: Record<string, unknown>): Rec {
    if (k === 'projects') return this.updateProject(id, input);
    const key = k as PCollKey;
    const p = this.ownerOf(k, id);
    const d = this.data(p);
    const cur = d[key].find((r) => r.id === id)!;
    const v = validate(k, input, 'update');
    this.checkRefs(p, d, key, v, id);
    this.checkUnique(d, key, { ...cur, ...v }, id);
    // 成果物は内容が変わったら版を上げ、旧内容を履歴に残す(F-008-005)
    if (key === 'artifacts' && typeof v.content === 'string' && v.content !== cur.content) {
      v.versions = [...(cur.versions as unknown[]), { version: cur.version, content: cur.content, savedAt: cur.updatedAt }];
      v.version = (cur.version as number) + 1;
      v.status = 'DRAFT';
      v.approved = false;
    }
    // マージ日時はサーバーが記録する(クライアントからは指定できない)
    if (key === 'pullRequests' && v.status === 'MERGED' && cur.status !== 'MERGED') v.mergedAt = now();
    Object.assign(cur, v, { updatedAt: now() });
    this.commit(p, [key]);
    this.appendAudit(p.id, { action: 'update', collection: k, entityId: id, detail: Object.keys(v).join(',') });
    return cur;
  }

  /** サーバー管理項目(承認フラグ等)を含めて更新する。ワークフロー用 */
  setInternal(k: PCollKey, id: string, fields: Record<string, unknown>, action: string): Rec {
    const p = this.ownerOf(k, id);
    const cur = this.data(p)[k].find((r) => r.id === id)!;
    Object.assign(cur, fields, { updatedAt: now() });
    this.commit(p, [k]);
    this.appendAudit(p.id, { action, collection: k, entityId: id });
    return cur;
  }

  private updateProject(id: string, input: Record<string, unknown>): Rec {
    const p = this.storeOf(id);
    const v = validate('projects', input, 'update');
    Object.assign(p.record, v, { updatedAt: now() });
    p.writeProject();
    this.saveManifest();
    this.appendAudit(id, { action: 'update', collection: 'projects', entityId: id, detail: Object.keys(v).join(',') });
    return p.record;
  }

  private ownerOf(k: CollKey, id: string): ProjectStore {
    const pid = this.idMap.get(id);
    const p = pid ? this.stores.get(pid) : undefined;
    if (!p || p.entries.get(id)?.c !== k) throw new HttpError(404, `データ ${id} が見つかりません`);
    return p;
  }

  /** 関連データも含めて削除する。参照される側(トレーサビリティ等)から先に書く */
  remove(k: CollKey, id: string): void {
    if (k === 'projects') return this.removeProject(id);
    const key = k as PCollKey;
    const p = this.ownerOf(k, id);
    const d = this.data(p);
    if (!d[key].some((r) => r.id === id)) throw new HttpError(404, `データ ${id} が見つかりません`);
    const order: PCollKey[] = [];
    const mark = (c: PCollKey) => { if (!order.includes(c)) order.push(c); };
    if (key !== 'traces') {
      const n = d.traces.length;
      d.traces = d.traces.filter((t) => t.sourceId !== id && t.targetId !== id);
      if (d.traces.length !== n) mark('traces');
    }
    if (key === 'workItems') for (const r of d.workItems) if (r.parentId === id) { r.parentId = ''; mark('workItems'); }
    if (key === 'repositories') {
      for (const c of ['branches', 'pullRequests', 'releases'] as PCollKey[]) {
        const n = d[c].length;
        d[c] = d[c].filter((r) => r.repositoryId !== id);
        if (d[c].length !== n) mark(c);
      }
    }
    d[key] = d[key].filter((r) => r.id !== id);
    mark(key);
    this.commit(p, order);
    this.appendAudit(p.id, { action: 'delete', collection: k, entityId: id });
  }

  /** 案件フォルダは削除せず trash/ に退避する(誤削除から復旧できる) */
  private removeProject(id: string): void {
    const p = this.storeOf(id);
    const trash = path.join(this.dataDir, 'trash');
    fs.mkdirSync(trash, { recursive: true });
    const dest = path.join(trash, `${id}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    try {
      fs.renameSync(p.dir, dest);
    } catch {
      fs.cpSync(p.dir, dest, { recursive: true });
      fs.rmSync(p.dir, { recursive: true, force: true });
    }
    this.stores.delete(id);
    for (const [eid, pid] of this.idMap) if (pid === id) this.idMap.delete(eid);
    this.saveManifest();
    this.appendAudit(null, { action: 'delete', collection: 'projects', entityId: id, detail: `trash/${path.basename(dest)}` });
  }

  /* ---------- 設定 ---------- */
  setSettings(patch: Record<string, string>): Record<string, string> {
    Object.assign(this.settings, patch);
    this.saveManifest();
    this.appendAudit(null, { action: 'update', collection: 'settings', entityId: 'settings', detail: Object.keys(patch).join(',') });
    return this.settings;
  }

  /* ---------- 監査ログ(案件ごとの追記専用ファイル) ---------- */
  private auditFile(pid: string | null): string {
    return pid && this.stores.has(pid) ? path.join(this.stores.get(pid)!.dir, 'audit.jsonl') : path.join(this.dataDir, 'audit.jsonl');
  }
  private appendAudit(pid: string | null, e: Omit<AuditEntry, 'id' | 'at'>): void {
    const entry: AuditEntry = { id: `AUD-${Date.now().toString(36)}-${(this.auditSeq++).toString(36)}`, at: now(), ...e };
    try {
      const file = this.auditFile(pid);
      this.rotateAuditIfNeeded(file);
      fs.appendFileSync(file, JSON.stringify(entry) + '\n');
    } catch (err) { console.warn('[warn] 監査ログを書けません:', (err as Error).message); }
  }
  /** サイズが上限を超えていたら audit.<日時>.jsonl に改名して新しいファイルに切り替え、古い世代を削除する */
  private rotateAuditIfNeeded(file: string): void {
    let size: number;
    try { size = fs.statSync(file).size; } catch { return; }
    if (size < this.auditMaxBytes) return;
    const dir = path.dirname(file);
    const stamp = `${new Date().toISOString().replace(/[-:.]/g, '')}-${(this.auditSeq++).toString(36).padStart(4, '0')}`;
    fs.renameSync(file, path.join(dir, `audit.${stamp}.jsonl`));
    if (this.auditKeepFiles > 0) {
      for (const old of this.auditArchives(dir).slice(this.auditKeepFiles)) fs.rmSync(path.join(dir, old), { force: true });
    }
  }
  /** 旧世代のログファイル名(新しい順) */
  private auditArchives(dir: string): string[] {
    return fs.readdirSync(dir).filter((n) => ARCHIVE_RE.test(n)).sort().reverse();
  }

  /** ルートから明示的に記録する操作(git操作・ワークフロー等) */
  log(action: string, collection: string, entityId: string, detail?: string): void {
    this.appendAudit(this.projectIdOf(entityId) ?? null, { action, collection, entityId, ...(detail ? { detail } : {}) });
  }
  /** 新しい順に返す。現行ファイルで足りなければ旧世代のファイルも順にさかのぼる */
  readAudit(opts: { projectId?: string; entityId?: string; limit: number }): AuditEntry[] {
    const pid = opts.projectId ?? (opts.entityId ? this.projectIdOf(opts.entityId) : undefined) ?? null;
    const current = this.auditFile(pid);
    const dir = path.dirname(current);
    const files = [current, ...this.auditArchives(dir).map((n) => path.join(dir, n))];
    const out: AuditEntry[] = [];
    for (const f of files) {
      if (!fs.existsSync(f)) continue;
      out.push(...this.readAuditFile(f, opts.entityId).reverse());
      if (out.length >= opts.limit) break;
    }
    return out.slice(0, opts.limit);
  }
  /** 1ファイルを古い順に読む(大きいファイルは末尾だけ。切り替えサイズ以内なら全体を読める) */
  private readAuditFile(file: string, entityId?: string): AuditEntry[] {
    const size = fs.statSync(file).size;
    const maxRead = Math.max(AUDIT_MIN_READ_BYTES, this.auditMaxBytes * 2);
    const fd = fs.openSync(file, 'r');
    let text: string;
    try {
      const start = Math.max(0, size - maxRead);
      const buf = Buffer.alloc(size - start);
      fs.readSync(fd, buf, 0, buf.length, start);
      text = buf.toString('utf8');
      if (start > 0) text = text.slice(text.indexOf('\n') + 1); // 途中から読んだ先頭の欠けた行を捨てる
    } finally {
      fs.closeSync(fd);
    }
    const rows: AuditEntry[] = [];
    for (const line of text.split('\n')) {
      if (!line) continue;
      try { const a = JSON.parse(line) as AuditEntry; if (!entityId || a.entityId === entityId) rows.push(a); } catch { /* 壊れた行は読み飛ばす */ }
    }
    return rows;
  }

  /* ---------- 運用 ---------- */
  /** インデックスをデータファイルから作り直す */
  reindex(projectId: string): { entries: number } {
    const p = this.storeOf(projectId);
    for (const [id, pid] of this.idMap) if (pid === p.id) this.idMap.delete(id);
    p.unload();
    try { p.rebuildIndex(); } finally { for (const id of p.entries.keys()) this.idMap.set(id, p.id); }
    this.data(p);
    return { entries: p.entries.size };
  }

  stats(projectId: string) {
    const p = this.storeOf(projectId);
    const by = (pred: (e: ReturnType<ProjectStore['entries']['values']> extends Iterator<infer T> ? T : never) => boolean) => [...p.entries.values()].filter(pred).length;
    const group = (c: PCollKey, f: 'type' | 'status') => {
      const m: Record<string, number> = {};
      for (const e of p.entries.values()) if (e.c === c) m[e[f]] = (m[e[f]] ?? 0) + 1;
      return m;
    };
    return {
      projectId,
      counts: p.counts(),
      summary: {
        contexts: by((e) => e.c === 'contexts'),
        documents: by((e) => e.c === 'artifacts' && e.origin !== 'AI'),
        aiArtifacts: by((e) => e.c === 'artifacts' && e.origin === 'AI'),
        tasks: by((e) => e.c === 'workItems' && ['TASK', 'REVIEW', 'FIX'].includes(e.type)),
        issues: by((e) => e.c === 'workItems' && e.type === 'BUG'),
        qa: by((e) => e.c === 'workItems' && e.type === 'QA'),
        executions: by((e) => e.c === 'executions'),
      },
      artifactsByType: group('artifacts', 'type'),
      artifactsByStatus: group('artifacts', 'status'),
    };
  }

  workspaceSummary() {
    return {
      schemaVersion: SCHEMA_VERSION,
      settings: this.settings,
      counters: this.counters,
      loadedProjects: this.loadedCount(),
      maxLoadedProjects: this.maxLoaded,
      projects: this.allStores().map((s) => ({
        id: s.id, name: s.record.name, status: s.record.status,
        folder: path.relative(this.dataDir, s.dir).split(path.sep).join('/'),
        entities: s.entries.size, counts: s.counts(), loaded: Boolean(s.data), error: s.loadError || undefined,
        files: PCOLLS.map(fileOf),
      })),
      unavailable: this.unavailable.map((u) => ({ id: u.id, folder: u.folder, reason: u.reason })),
    };
  }
}
