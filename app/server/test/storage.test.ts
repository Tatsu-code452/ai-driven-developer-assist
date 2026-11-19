import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import { Database } from '../src/db.ts';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aidda-store-'));
let seq = 0;
const newDir = () => path.join(root, `d${++seq}`);
test.after(() => fs.rmSync(root, { recursive: true, force: true }));

type App = ReturnType<typeof createApp> & { base: string; api: (m: string, p: string, b?: unknown) => Promise<{ status: number; body: any }>; stop: () => Promise<void>; dir: string };
async function start(dir: string, maxLoaded = 20): Promise<App> {
  const app = createApp(loadConfig({ DATA_DIR: dir, GIT_WORKSPACE_ROOT: path.join(root, 'ws'), MAX_LOADED_PROJECTS: String(maxLoaded) }));
  await new Promise<void>((r) => app.server.listen(0, r));
  const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  const api = async (method: string, p: string, body?: unknown) => {
    const res = await fetch(base + p, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  };
  const stop = async () => {
    app.server.closeAllConnections();
    await new Promise<void>((r) => app.server.close(() => r()));
    app.db.close();
  };
  return Object.assign(app, { base, api, stop, dir });
}
const proj = (a: App, name: string) => a.api('POST', '/api/projects', { name, rootPath: './d', status: 'ACTIVE' }).then((r) => r.body.id as string);
const ctx = (a: App, projectId: string, title: string, content = 'c', extra: object = {}) =>
  a.api('POST', '/api/contexts', { projectId, title, type: 'REQUIREMENT', content, ...extra }).then((r) => r.body);
const readJson = (...p: string[]) => JSON.parse(fs.readFileSync(path.join(...p), 'utf8'));

test('レイアウト: workspace.json と案件フォルダ(分割ファイル+index.json)', async () => {
  const a = await start(newDir());
  const p1 = await proj(a, 'A');
  const p2 = await proj(a, 'B');
  const c = await ctx(a, p1, '認証', '本文'.repeat(300), { tags: ['auth'] });
  await a.api('POST', '/api/work-items', { projectId: p1, type: 'TASK', title: 't' });
  await a.stop();

  assert.ok(!fs.existsSync(path.join(a.dir, 'db.json')), '単一の db.json は作らない');
  const m = readJson(a.dir, 'workspace.json');
  assert.equal(m.schemaVersion, 2);
  assert.deepEqual(m.projects.map((x: any) => [x.id, x.folder]), [[p1, `projects/${p1}`], [p2, `projects/${p2}`]]);
  assert.equal(m.counters.CTX, 1);
  assert.equal(m.counters.PRJ, 2);

  const f1 = path.join(a.dir, 'projects', p1);
  for (const n of ['project.json', 'contexts.json', 'work-items.json', 'artifacts.json', 'traceability.json', 'index.json', 'audit.jsonl']) {
    assert.ok(fs.existsSync(path.join(f1, n)), `${n} がある`);
  }
  assert.equal(readJson(f1, 'contexts.json')[0].id, c.id);
  assert.deepEqual(readJson(a.dir, 'projects', p2, 'contexts.json'), [], '別案件のデータは混ざらない');
  const idx = readJson(f1, 'index.json');
  const e = idx.entries.find((x: any) => x.id === c.id);
  assert.equal(e.title, '認証');
  assert.deepEqual(e.tags, ['auth']);
  assert.equal(e.excerpt.length, 300, '本文はインデックスに冒頭だけ持つ');
  assert.ok(idx.files['contexts'].size > 0, 'データファイルの指紋を持つ');
  assert.equal(idx.counts.contexts, 1);
});

test('再起動: データ復元と採番の継続(削除したIDを再利用しない)', async () => {
  const dir = newDir();
  let a = await start(dir);
  const p = await proj(a, 'A');
  const c1 = await ctx(a, p, 'one');
  assert.equal(c1.id, 'CTX-001');
  await a.api('DELETE', `/api/contexts/${c1.id}`);
  assert.equal((await ctx(a, p, 'two')).id, 'CTX-002');
  await a.stop();

  a = await start(dir);
  assert.equal((await a.api('GET', `/api/contexts?projectId=${p}`)).body.items[0].title, 'two');
  assert.equal((await ctx(a, p, 'three')).id, 'CTX-003');
  await a.stop();
});

test('索引: 外部編集を検知して再構築し、採番も衝突しない', async () => {
  const dir = newDir();
  let a = await start(dir);
  const p = await proj(a, 'A');
  await ctx(a, p, 'known');
  await a.stop();

  // 手でデータファイルを書き換える(別ツールやGit操作で変わった想定)。manifest のカウンタは古いまま
  const f = path.join(dir, 'projects', p, 'contexts.json');
  const arr = readJson(f);
  arr.push({ ...arr[0], id: 'CTX-900', title: '手で追加', content: 'external', createdAt: arr[0].createdAt, updatedAt: arr[0].updatedAt });
  fs.writeFileSync(f, JSON.stringify(arr));

  a = await start(dir);
  assert.equal((await a.api('GET', '/api/contexts/CTX-900')).body.title, '手で追加', 'インデックスが再構築され引き当てできる');
  assert.equal((await a.api('GET', `/api/search?q=${encodeURIComponent('手で')}`)).body.items[0].id, 'CTX-900');
  assert.equal((await ctx(a, p, 'next')).id, 'CTX-901', '採番は実在する最大ID以降から');
  await a.stop();
});

test('検索: インデックス検索は案件を読み込まず、全文検索は本文全体を見る', async () => {
  const dir = newDir();
  let a = await start(dir, 1);
  const p1 = await proj(a, 'A');
  const p2 = await proj(a, 'B');
  await ctx(a, p1, 'ログイン設計', `${'あ'.repeat(400)} ZEBRA終端`, { tags: ['security'] });
  await ctx(a, p2, '別案件のZEBRA資料', 'x');
  await a.stop();

  a = await start(dir, 1);
  assert.equal(a.db.loadedCount(), 0, '起動時はインデックスだけ読み、案件データは読まない');
  const byTitle = (await a.api('GET', `/api/search?q=${encodeURIComponent('ログイン')}`)).body;
  assert.equal(byTitle.mode, 'index');
  assert.deepEqual(byTitle.items.map((i: any) => [i.projectId, i.matched]), [[p1, 'title']]);
  assert.equal(a.db.loadedCount(), 0, 'インデックス検索では案件データを読み込まない');
  const byTag = (await a.api('GET', '/api/search?q=security')).body.items;
  assert.equal(byTag[0].matched, 'tags');

  const shallow = (await a.api('GET', '/api/search?q=zebra')).body;
  assert.deepEqual(shallow.items.map((i: any) => i.projectId), [p2], '冒頭300文字の外にある語は、インデックス検索では見つからない');
  assert.ok(shallow.note.includes('deep=1'));
  const deepAll = (await a.api('GET', '/api/search?q=zebra&deep=1')).body;
  assert.deepEqual(deepAll.items.map((i: any) => i.projectId).sort(), [p1, p2].sort());
  assert.equal(deepAll.items.find((i: any) => i.projectId === p1).matched, 'content');
  assert.ok(a.db.loadedCount() <= 1, 'LRUで常駐は上限まで');
  const inProj = (await a.api('GET', `/api/search?q=zebra&projectId=${p1}`)).body;
  assert.equal(inProj.mode, 'full', '案件を指定した検索は既定で全文');
  assert.equal(inProj.items.length, 1);
  await a.stop();
});

test('LRUで常駐を手放しても、書き込みは失われない', async () => {
  const dir = newDir();
  let a = await start(dir, 1);
  const ps = [await proj(a, 'A'), await proj(a, 'B'), await proj(a, 'C')];
  for (let i = 0; i < 4; i++) for (const p of ps) await ctx(a, p, `c${i}`);
  assert.ok(a.db.loadedCount() <= 1);
  for (const p of ps) assert.equal((await a.api('GET', `/api/contexts?projectId=${p}`)).body.total, 4);
  await a.stop();
  a = await start(dir, 1);
  for (const p of ps) assert.equal((await a.api('GET', `/api/contexts?projectId=${p}`)).body.total, 4);
  assert.equal((await a.api('GET', '/api/contexts/CTX-012')).status, 200);
  await a.stop();
});

test('案件の分離: 別案件の項目とは関連付け・親子・リポジトリ参照ができない', async () => {
  const a = await start(newDir());
  const p1 = await proj(a, 'A');
  const p2 = await proj(a, 'B');
  const c1 = await ctx(a, p1, 'c1');
  const c2 = await ctx(a, p2, 'c2');
  const t2 = (await a.api('POST', '/api/work-items', { projectId: p2, type: 'TASK', title: 't2' })).body;
  const repo2 = (await a.api('POST', '/api/repositories', { projectId: p2, url: 'https://github.com/o/r' })).body;

  const tr = await a.api('POST', '/api/traceability', { projectId: p1, sourceId: c1.id, targetId: c2.id, relationType: 'INPUT' });
  assert.equal(tr.status, 400);
  assert.match(tr.body.error.message, /別のプロジェクト/);
  assert.equal((await a.api('POST', '/api/work-items', { projectId: p1, type: 'TASK', title: 'x', parentId: t2.id })).status, 400);
  assert.equal((await a.api('POST', '/api/branches', { projectId: p1, repositoryId: repo2.id, name: 'b' })).status, 400);
  assert.equal((await a.api('POST', '/api/contexts', { projectId: 'PRJ-404', title: 't', type: 'DESIGN', content: 'c' })).status, 400);
  await a.stop();
});

test('障害の局所化: 壊れた案件があっても他の案件は動き、バックアップから復旧できる', async () => {
  const dir = newDir();
  let a = await start(dir);
  const p1 = await proj(a, 'OK');
  const p2 = await proj(a, 'BROKEN');
  await ctx(a, p1, 'healthy');
  for (const t of ['first', 'second']) await a.api('POST', '/api/artifacts', { projectId: p2, artifactType: 'DESIGN', title: t });
  await a.stop();
  const f = path.join(dir, 'projects', p2, 'artifacts.json');
  assert.ok(fs.existsSync(`${f}.bak`), '直前の版が .bak に残る');

  // A: 本体だけ壊れた → .bak から自動復旧(最後の1件は失われるが、案件は使える)
  fs.writeFileSync(f, '{broken');
  a = await start(dir);
  const rec = (await a.api('GET', `/api/artifacts?projectId=${p2}`)).body;
  assert.equal(rec.total, 1);
  assert.equal(rec.items[0].title, 'first');
  await a.stop();

  // B: 本体もバックアップも壊れた → その案件だけが 500、他は正常
  fs.writeFileSync(f, '{broken');
  fs.writeFileSync(`${f}.bak`, 'also broken');
  a = await start(dir);
  const bad = await a.api('GET', `/api/artifacts?projectId=${p2}`);
  assert.equal(bad.status, 500);
  assert.ok(bad.body.error.message.includes(p2) && bad.body.error.message.includes('artifacts.json'));
  assert.equal((await a.api('GET', `/api/contexts?projectId=${p1}`)).body.total, 1, '他の案件は影響を受けない');
  assert.ok((await a.api('GET', '/api/workspace')).body.projects.find((p: any) => p.id === p2).error);

  // 手当て(空に戻す)してから再インデックス → 再起動なしで復帰
  fs.writeFileSync(f, '[]');
  fs.rmSync(`${f}.bak`);
  assert.equal((await a.api('POST', `/api/projects/${p2}/reindex`)).status, 200);
  assert.equal((await a.api('GET', `/api/artifacts?projectId=${p2}`)).status, 200);
  await a.stop();
});

test('案件削除はフォルダを trash/ に退避し、IDは再利用されない', async () => {
  const dir = newDir();
  const a = await start(dir);
  const p1 = await proj(a, 'A');
  const c = await ctx(a, p1, 'keep me');
  assert.equal((await a.api('DELETE', `/api/projects/${p1}`)).status, 204);
  assert.ok(!fs.existsSync(path.join(dir, 'projects', p1)));
  const trashed = fs.readdirSync(path.join(dir, 'trash'))[0];
  assert.ok(trashed.startsWith(p1));
  assert.equal(readJson(dir, 'trash', trashed, 'contexts.json')[0].title, 'keep me', '中身は無傷で残る');
  assert.equal(readJson(dir, 'workspace.json').projects.length, 0);
  assert.equal((await a.api('GET', `/api/contexts/${c.id}`)).status, 404);
  assert.equal(await proj(a, 'B'), 'PRJ-002');
  const audit = (await a.api('GET', '/api/audit')).body.items;
  assert.ok(audit.some((x: any) => x.action === 'delete' && x.entityId === p1 && x.detail.startsWith('trash/')), '案件に属さない操作はルートの監査ログへ');
  await a.stop();
});

test('オーケストレーター: 持ち込み案件の取り込み・重複と不正な folder の隔離・manifest 破損からの再構築', async () => {
  const dir = newDir();
  let a = await start(dir);
  const p1 = await proj(a, 'A');
  await ctx(a, p1, 'c');
  await a.stop();

  // フォルダを別名でコピー(ID重複)+ ID違いのフォルダを手で持ち込む
  fs.cpSync(path.join(dir, 'projects', p1), path.join(dir, 'projects', 'copy-of-a'), { recursive: true });
  const foreign = path.join(dir, 'projects', 'imported');
  fs.mkdirSync(foreign);
  fs.writeFileSync(path.join(foreign, 'project.json'), JSON.stringify({ schemaVersion: 2, project: { id: 'PRJ-050', name: '持ち込み', description: '', status: 'ACTIVE', rootPath: '.', createdAt: 't', updatedAt: 't' } }));
  fs.writeFileSync(path.join(foreign, 'contexts.json'), JSON.stringify([{ id: 'CTX-700', projectId: 'PRJ-050', title: '外部のコンテキスト', type: 'DESIGN', content: 'x', sourceArtifactIds: [], tags: [], createdAt: 't', updatedAt: 't' }]));
  // manifest の folder を DATA_DIR の外に向ける
  const m = readJson(dir, 'workspace.json');
  m.projects.push({ id: 'PRJ-099', name: 'evil', status: 'ACTIVE', folder: '../outside', createdAt: 't', updatedAt: 't' });
  fs.writeFileSync(path.join(dir, 'workspace.json'), JSON.stringify(m));

  a = await start(dir);
  const ids = (await a.api('GET', '/api/projects')).body.items.map((p: any) => p.id).sort();
  assert.deepEqual(ids, [p1, 'PRJ-050'].sort(), '持ち込みは取り込まれ、ID重複のコピーは無視される');
  assert.equal((await a.api('GET', '/api/contexts/CTX-700')).body.title, '外部のコンテキスト');
  const ws = (await a.api('GET', '/api/workspace')).body;
  assert.equal(ws.unavailable[0].id, 'PRJ-099');
  assert.match(ws.unavailable[0].reason, /外を指して/);
  assert.ok(ws.projects.every((p: any) => !p.folder.startsWith('..')), '絶対パスや外部パスを返さない');
  assert.equal(readJson(dir, 'workspace.json').projects.find((x: any) => x.id === 'PRJ-099').folder, '../outside', '隔離しても一覧からは消さない');
  await a.stop();

  // manifest が本体・バックアップとも壊れても、案件フォルダから再構築できる
  fs.writeFileSync(path.join(dir, 'workspace.json'), 'garbage');
  fs.rmSync(path.join(dir, 'workspace.json.bak'), { force: true });
  a = await start(dir);
  assert.deepEqual((await a.api('GET', '/api/projects')).body.items.map((p: any) => p.id).sort(), [p1, 'PRJ-050'].sort());
  assert.equal((await ctx(a, p1, 'after rebuild')).id, 'CTX-701', '採番は実在IDの最大値から続く');
  await a.stop();
});

test('旧形式 db.json からの移行', async () => {
  const dir = newDir();
  fs.mkdirSync(dir);
  const t = '2026-01-01T00:00:00.000Z';
  const base = { createdAt: t, updatedAt: t };
  const legacy = {
    data: {
      projects: [{ id: 'PRJ-001', name: '旧A', description: '', status: 'ACTIVE', rootPath: './a', ...base }, { id: 'PRJ-002', name: '旧B', description: '', status: 'PLANNING', rootPath: './b', ...base }],
      contexts: [{ id: 'CTX-001', projectId: 'PRJ-001', title: 'A側', type: 'REQUIREMENT', content: 'a', sourceArtifactIds: [], tags: [], ...base }, { id: 'CTX-002', projectId: 'PRJ-002', title: 'B側', type: 'DESIGN', content: 'b', sourceArtifactIds: [], tags: [], ...base }, { id: 'CTX-003', projectId: 'PRJ-404', title: '孤児', type: 'DESIGN', content: 'x', sourceArtifactIds: [], tags: [], ...base }],
      workItems: [{ id: 'TSK-001', projectId: 'PRJ-001', type: 'TASK', title: 't', description: '', status: 'TODO', priority: 'MEDIUM', assignee: '', parentId: '', answer: '', isKnowledge: false, ...base }],
      prompts: [], executions: [], artifacts: [], traces: [{ id: 'TRC-001', projectId: 'PRJ-001', sourceType: 'contexts', sourceId: 'CTX-001', targetType: 'workItems', targetId: 'TSK-001', relationType: 'INPUT', ...base }],
      repositories: [], branches: [], pullRequests: [], releases: [],
    },
    counters: { PRJ: 2, CTX: 3, TSK: 1, TRC: 1, AUD: 7 },
    audit: [{ id: 'AUD-00001', at: t, action: 'create', collection: 'projects', entityId: 'PRJ-001' }],
    settings: { theme: 'dark' },
  };
  fs.writeFileSync(path.join(dir, 'db.json'), JSON.stringify(legacy));

  const a = await start(dir);
  assert.ok(!fs.existsSync(path.join(dir, 'db.json')) && fs.existsSync(path.join(dir, 'db.json.migrated')), '元ファイルは消さずに改名して残す');
  assert.deepEqual((await a.api('GET', '/api/projects')).body.items.map((p: any) => p.name), ['旧A', '旧B']);
  assert.equal((await a.api('GET', '/api/contexts?projectId=PRJ-001')).body.items[0].title, 'A側');
  assert.equal((await a.api('GET', '/api/contexts?projectId=PRJ-002')).body.items[0].title, 'B側');
  assert.equal((await a.api('GET', '/api/contexts/CTX-003')).status, 404, '案件に属さないデータは移行されない');
  assert.equal((await a.api('GET', '/api/traceability?projectId=PRJ-001')).body.total, 1);
  assert.equal((await a.api('GET', '/api/settings')).body.theme, 'dark');
  assert.equal((await ctx(a, 'PRJ-001', 'new')).id, 'CTX-004', '採番は旧カウンタから継続');
  assert.equal((await a.api('GET', '/api/audit')).body.items[0].entityId, 'PRJ-001');
  await a.stop();
});

test('二重起動の防止(使用中のPIDがあるデータディレクトリは開けない)', async () => {
  const dir = newDir();
  fs.mkdirSync(dir);
  const child = spawn('sleep', ['30']);
  try {
    fs.writeFileSync(path.join(dir, '.lock'), String(child.pid));
    assert.throws(() => new Database(dir), /別のプロセス/);
    child.kill();
    await new Promise((r) => child.once('exit', r));
    const db = new Database(dir); // 終了済みPIDの古いロックは無視して引き継ぐ
    db.close();
    assert.ok(!fs.existsSync(path.join(dir, '.lock')));
  } finally {
    child.kill();
  }
});

test('運用API: workspace 概要・stats(インデックスのみ)・reindex・監査ログ', async () => {
  const dir = newDir();
  let a = await start(dir);
  const p = await proj(a, 'A');
  await ctx(a, p, 'c1');
  await a.api('POST', '/api/work-items', { projectId: p, type: 'BUG', title: 'bug' });
  await a.api('POST', '/api/work-items', { projectId: p, type: 'TASK', title: 'task' });
  await a.api('POST', '/api/artifacts', { projectId: p, artifactType: 'DESIGN', title: 'doc' });
  await a.api('POST', '/api/artifacts', { projectId: p, artifactType: 'DESIGN', title: 'ai', origin: 'AI' });
  await a.stop();

  a = await start(dir);
  assert.equal(a.db.loadedCount(), 0);
  const st = (await a.api('GET', `/api/projects/${p}/stats`)).body;
  assert.deepEqual(st.summary, { contexts: 1, documents: 1, aiArtifacts: 1, tasks: 1, issues: 1, qa: 0, executions: 0 });
  assert.equal(st.artifactsByType.DESIGN, 2);
  assert.equal(a.db.loadedCount(), 0, 'stats はインデックスだけで返す');
  const ws = (await a.api('GET', '/api/workspace')).body;
  assert.deepEqual([ws.projects[0].folder, ws.projects[0].entities, ws.projects[0].loaded], [`projects/${p}`, 5, false]);
  assert.ok(ws.projects[0].files.includes('work-items.json'));

  // インデックスが壊れても reindex で直る
  fs.writeFileSync(path.join(dir, 'projects', p, 'index.json'), JSON.stringify({ schemaVersion: 1, projectId: p, files: {}, entries: [] }));
  assert.equal((await a.api('POST', `/api/projects/${p}/reindex`)).body.entries, 5);
  assert.equal((await a.api('GET', `/api/search?q=bug&projectId=${p}`)).body.items[0].title, 'bug');

  const log = (await a.api('GET', `/api/audit?projectId=${p}&limit=3`)).body.items;
  assert.equal(log.length, 3);
  assert.ok(log[0].at >= log[2].at, '新しい順');
  await a.stop();
});
