import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aidda-'));
const fixtures = path.join(import.meta.dirname, 'fixtures');

// 擬似AIサーバー(OpenAI互換)
let lastAuth = '';
const fakeAi = http.createServer((req, res) => {
  lastAuth = String(req.headers.authorization);
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => {
    const content = (JSON.parse(b) as { messages: { content: string }[] }).messages[0].content;
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ choices: [{ message: { content: `echo:${content}` } }] }));
  });
});
await new Promise<void>((r) => fakeAi.listen(0, r));
const aiUrl = `http://127.0.0.1:${(fakeAi.address() as AddressInfo).port}/v1/chat/completions`;

const cfg = loadConfig({ DATA_DIR: path.join(tmp, 'data'), GIT_WORKSPACE_ROOT: path.join(tmp, 'ws'), COPILOT_API_URL: aiUrl, COPILOT_API_KEY: 'k-1', COPILOT_MODEL: 'm' });
const { server, db } = createApp(cfg);
await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

async function call(origin: string, method: string, p: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(origin + p, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined } as { status: number; body: any };
}
const api = (m: string, p: string, b?: unknown) => call(base, m, p, b);

test.after(() => { server.close(); fakeAi.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

let pid = '';

test('基本: health / 404 / 405 / 不正JSON', async () => {
  assert.equal((await api('GET', '/api/health')).body.status, 'ok');
  assert.equal((await api('GET', '/api/nothing')).status, 404);
  assert.equal((await api('PUT', '/api/projects')).status, 405);
  const bad = await fetch(`${base}/api/projects`, { method: 'POST', body: '{oops', headers: { 'content-type': 'application/json' } });
  assert.equal(bad.status, 400);
});

test('プロジェクト: 検証・採番・更新・一覧フィルタ', async () => {
  const bad = await api('POST', '/api/projects', { name: '', status: 'XXX' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.error.details.length >= 2);
  const p = await api('POST', '/api/projects', { name: 'P1', description: 'd', status: 'ACTIVE', rootPath: './datas' });
  assert.equal(p.status, 201);
  assert.equal(p.body.id, 'PRJ-001');
  pid = p.body.id;
  const up = await api('PATCH', `/api/projects/${pid}`, { name: 'P1改', id: 'HACK', createdAt: 'x' });
  assert.equal(up.body.name, 'P1改');
  assert.equal(up.body.id, pid);
  assert.notEqual(up.body.createdAt, 'x');
  assert.equal((await api('GET', '/api/projects?status=DONE')).body.total, 0);
  assert.equal((await api('GET', '/api/projects?q=P1')).body.total, 1);
  assert.equal((await api('GET', '/api/projects/PRJ-999')).status, 404);
});

let ctxId = '', taskId = '', bugId = '', qaId = '';
test('WorkItem/Context: 種別ごとの採番と参照チェック', async () => {
  assert.equal((await api('POST', '/api/contexts', { projectId: 'PRJ-404', title: 't', type: 'REQUIREMENT', content: 'c' })).status, 400);
  ctxId = (await api('POST', '/api/contexts', { projectId: pid, title: 'ログイン要件', type: 'REQUIREMENT', content: 'ID/パスワードで認証する', tags: ['認証'] })).body.id;
  assert.equal(ctxId, 'CTX-001');
  taskId = (await api('POST', '/api/work-items', { projectId: pid, type: 'TASK', title: '認証の分析', description: '詳細を整理', status: 'TODO' })).body.id;
  bugId = (await api('POST', '/api/work-items', { projectId: pid, type: 'BUG', title: '落ちる', status: 'OPEN' })).body.id;
  qaId = (await api('POST', '/api/work-items', { projectId: pid, type: 'QA', title: '質問', status: 'OPEN' })).body.id;
  assert.deepEqual([taskId, bugId, qaId], ['TSK-001', 'BUG-001', 'QAA-001']);
  const self = await api('PATCH', `/api/work-items/${taskId}`, { parentId: taskId });
  assert.equal(self.status, 400);
  const child = await api('POST', '/api/work-items', { projectId: pid, type: 'TASK', title: '子', parentId: taskId });
  assert.equal(child.body.parentId, taskId);
  assert.equal((await api('PATCH', `/api/work-items/${taskId}`, { type: 'BUG' })).body.type, 'TASK', '種別は変更不可');
  assert.equal((await api('DELETE', `/api/work-items/${child.body.id}`)).status, 204);
});

test('プロンプト: テンプレート展開(F-006)', async () => {
  const pr = await api('POST', '/api/prompts', { projectId: pid, name: 'T', role: 'REQ', template: '役割:{{role}}\n{{task}}', outputFormat: 'Markdown' });
  assert.equal(pr.body.id, 'PRM-001');
  const out = await api('POST', `/api/prompts/${pr.body.id}/render`, { workItemId: taskId, contextIds: [ctxId] });
  assert.equal(out.status, 200);
  const text: string = out.body.prompt;
  assert.ok(text.startsWith('役割:要件定義'));
  assert.ok(text.includes('[TSK-001] 認証の分析'));
  assert.ok(text.includes('### ログイン要件 (CTX-001)'), '未記載の{{contexts}}は末尾に追記される');
  assert.ok(text.endsWith('## 出力形式\nMarkdown'));
  assert.equal((await api('POST', `/api/prompts/${pr.body.id}/render`, { contextIds: ['CTX-404'] })).status, 404);
});

let artId = '';
test('成果物: 版管理とレビュー・承認フロー(F-008)', async () => {
  const a = await api('POST', '/api/artifacts', { projectId: pid, artifactType: 'DESIGN', title: '基本設計', content: 'v1', workItemId: taskId, version: 99, approved: true });
  artId = a.body.id;
  assert.equal(a.body.version, 1, 'version はサーバー管理');
  assert.equal(a.body.approved, false);
  assert.equal((await api('POST', `/api/artifacts/${artId}/approve`)).status, 409, 'DRAFTから直接承認できない');
  assert.equal((await api('POST', `/api/artifacts/${artId}/review`)).body.status, 'REVIEW');
  const ap = await api('POST', `/api/artifacts/${artId}/approve`, { reviewNote: 'OK' });
  assert.deepEqual([ap.body.status, ap.body.approved, ap.body.reviewNote], ['APPROVED', true, 'OK']);
  assert.equal((await api('POST', `/api/artifacts/${artId}/baseline`)).body.status, 'BASELINE');
  const edited = await api('PATCH', `/api/artifacts/${artId}`, { content: 'v2' });
  assert.deepEqual([edited.body.version, edited.body.status, edited.body.approved], [2, 'DRAFT', false]);
  const same = await api('PATCH', `/api/artifacts/${artId}`, { title: '基本設計書' });
  assert.equal(same.body.version, 2, '内容が同じなら版は上がらない');
  const v = await api('GET', `/api/artifacts/${artId}/versions`);
  assert.equal(v.body.history.length, 1);
  assert.equal(v.body.history[0].content, 'v1');
});

test('トレーサビリティ: 関連付け・マトリクス・影響分析(F-012)', async () => {
  assert.equal((await api('POST', '/api/traceability', { projectId: pid, sourceId: ctxId, targetId: ctxId, relationType: 'INPUT' })).status, 400);
  assert.equal((await api('POST', '/api/traceability', { projectId: pid, sourceId: ctxId, targetId: 'TSK-404', relationType: 'INPUT' })).status, 400);
  const t1 = await api('POST', '/api/traceability', { projectId: pid, sourceId: ctxId, targetId: taskId, relationType: 'INPUT', sourceType: 'ウソ' });
  assert.equal(t1.body.sourceType, 'contexts', '種別はサーバーが決める');
  assert.equal((await api('POST', '/api/traceability', { projectId: pid, sourceId: ctxId, targetId: taskId, relationType: 'INPUT' })).status, 409);
  await api('POST', '/api/traceability', { projectId: pid, sourceId: taskId, targetId: artId, relationType: 'OUTPUT' });

  const m = (await api('GET', `/api/traceability/matrix?projectId=${pid}`)).body;
  assert.equal(m.rows.length, 1);
  assert.equal(m.rows[0].cells.TASK.length, 1);
  assert.equal(m.rows[0].cells.DESIGN.length, 1);
  assert.deepEqual(m.missing.map((x: any) => x.column).sort(), ['SOURCE', 'TEST']);
  assert.equal(m.coverage, 50);

  const d1 = (await api('GET', `/api/traceability/impact/${ctxId}?depth=1`)).body.items;
  assert.deepEqual(d1.map((x: any) => x.id), [taskId]);
  const d2 = (await api('GET', `/api/traceability/impact/${ctxId}?depth=2`)).body.items;
  assert.deepEqual(d2.map((x: any) => [x.id, x.distance]), [[taskId, 1], [artId, 2]]);

  const gaps = (await api('GET', `/api/traceability/gaps?projectId=${pid}`)).body;
  const unlinked = gaps.unlinked.map((x: any) => x.id);
  assert.ok(unlinked.includes(bugId) && unlinked.includes(qaId) && !unlinked.includes(taskId));
});

test('タスク生成: コンテキスト→タスク / 課題→対応タスク', async () => {
  const t = await api('POST', `/api/contexts/${ctxId}/task`, {});
  assert.equal(t.status, 201);
  assert.equal(t.body.trace.relationType, 'INPUT');
  const fix = await api('POST', `/api/work-items/${bugId}/fix-task`, {});
  assert.equal(fix.body.task.type, 'FIX');
  assert.equal(fix.body.task.parentId, bugId);
  assert.equal((await api('POST', `/api/work-items/${taskId}/fix-task`, {})).status, 409);
});

test('AI: 実行・履歴保存・比較・成果物登録(F-007)', async () => {
  const bad = await api('POST', '/api/ai/execute', { aiType: 'NOPE', prompt: 'x' });
  assert.equal(bad.status, 400);
  assert.equal((await api('POST', '/api/ai/execute', { aiType: 'GEMINI', prompt: 'x' })).status, 501, '未設定のAIは501');
  const ok = await api('POST', '/api/ai/execute', { aiType: 'COPILOT', prompt: 'hello', save: { projectId: pid, workItemId: taskId, contextIds: [ctxId] } });
  assert.equal(ok.body.response, 'echo:hello');
  assert.equal(lastAuth, 'Bearer k-1');
  assert.equal(ok.body.execution.id, 'EXE-001');
  const e2 = await api('POST', '/api/executions', { projectId: pid, workItemId: taskId, aiType: 'GEMINI', requestText: 'r', responseText: 'a\nb\nc' });
  await api('PATCH', `/api/executions/${ok.body.execution.id}`, { responseText: 'a\nb\nz' });
  const cmp = (await api('GET', `/api/executions/compare?a=${ok.body.execution.id}&b=${e2.body.id}`)).body;
  assert.deepEqual(cmp.a.lines.map((l: any) => l.onlyHere), [false, false, true]);
  assert.deepEqual(cmp.b.lines.map((l: any) => l.onlyHere), [false, false, true]);

  const empty = await api('POST', '/api/executions', { projectId: pid, aiType: 'GEMINI', requestText: 'r' });
  assert.equal((await api('POST', `/api/executions/${empty.body.id}/artifact`, { title: 'x' })).status, 400);
  const reg = await api('POST', `/api/executions/${e2.body.id}/artifact`, { title: 'AI設計', artifactType: 'DESIGN' });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.artifact.origin, 'AI');
  assert.equal(reg.body.artifact.content, 'a\nb\nc');
  assert.equal(reg.body.traces.length, 2);
});

test('AI: Gemini接続(fetch注入)', async () => {
  let seen: { url: string; key: string | null } = { url: '', key: null };
  const fakeFetch = (async (url: string, init: RequestInit) => {
    seen = { url, key: new Headers(init.headers).get('x-goog-api-key') };
    return Response.json({ candidates: [{ content: { parts: [{ text: 'gem' }, { text: 'ini' }] } }] });
  }) as unknown as typeof fetch;
  const app = createApp(loadConfig({ DATA_DIR: path.join(tmp, 'd2'), GEMINI_API_KEY: 'gk', GEMINI_MODEL: 'g-1' }), { fetch: fakeFetch });
  await new Promise<void>((r) => app.server.listen(0, r));
  const o = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  const r = await call(o, 'POST', '/api/ai/execute', { aiType: 'GEMINI', prompt: 'p' });
  assert.equal(r.body.response, 'gemini');
  assert.ok(seen.url.endsWith('/models/g-1:generateContent'));
  assert.equal(seen.key, 'gk');
  app.server.close();
});

test('ファイル変換: txt / docx / xlsx / 未対応形式 / 登録(F-003)', async () => {
  const send = async (name: string, data: Buffer | string, extra: Record<string, string> = {}) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    fd.append("file", new Blob([typeof data === "string" ? data : new Uint8Array(data)]), name);
    const res = await fetch(`${base}/api/convert`, { method: 'POST', body: fd });
    return { status: res.status, body: (await res.json()) as any };
  };
  const txt = await send('メモ.md', '\uFEFF# 見出し\n本文');
  assert.equal(txt.body.text, '# 見出し\n本文');

  const docx = await send('sample.docx', fs.readFileSync(path.join(fixtures, 'sample.docx')));
  assert.equal(docx.status, 200);
  assert.ok(docx.body.text.includes('要件定義書') && docx.body.text.includes('ログイン機能 & 認証'), docx.body.text);
  assert.ok(/ID\tF-001/.test(docx.body.text), '表のセルはタブ区切り');

  const xlsx = await send('sample.xlsx', fs.readFileSync(path.join(fixtures, 'sample.xlsx')));
  assert.ok(xlsx.body.text.includes('## 機能一覧'));
  assert.ok(xlsx.body.text.includes('F-001-001\tプロジェクト一覧'));
  assert.ok(xlsx.body.text.includes('\t\t42'), '空セルを保ったまま列位置を維持する');
  assert.ok(xlsx.body.text.includes('## 画面') && xlsx.body.text.includes('SCR-001\tダッシュボード'));

  assert.equal((await send('old.doc', 'x')).status, 415);
  assert.equal((await send('broken.docx', 'not a zip')).status, 422);
  const reg = await send('要件.txt', '登録される本文', { projectId: pid, artifactType: 'REQUIREMENT' });
  assert.equal(reg.body.artifact.origin, 'CONVERTED');
  assert.equal(reg.body.artifact.title, '要件');
  assert.equal((await send('x.txt', 'x', { projectId: 'PRJ-404' })).status, 400);
  assert.equal((await call(base, 'POST', '/api/convert', {})).status, 400);
});

test('ダッシュボード / 検索 / 監査ログ / 設定', async () => {
  const d = (await api('GET', `/api/dashboard?projectId=${pid}`)).body;
  assert.equal(d.issues.open, 1);
  assert.equal(d.qa.unanswered, 1);
  assert.equal(d.executions.total, 3);
  assert.equal(d.executions.byAiType.GEMINI, 2);
  assert.equal((await api('GET', '/api/dashboard')).status, 400);
  const s = (await api('GET', `/api/search?projectId=${pid}&q=${encodeURIComponent('パスワード')}`)).body.items;
  assert.equal(s[0].id, ctxId);
  assert.equal((await api('GET', `/api/search?projectId=${pid}`)).status, 400);
  const audit = (await api('GET', `/api/audit?entityId=${artId}`)).body;
  assert.ok(audit.items.some((a: any) => a.action === 'artifact:approved'));
  assert.equal((await api('PUT', '/api/settings', { theme: 'dark' })).body.theme, 'dark');
  assert.equal((await api('PUT', '/api/settings', { n: 1 })).status, 400);
});

test('Git: コミット・ブランチ・マージ・競合復旧・worktree(F-013)', async () => {
  const g = (cwd: string, ...a: string[]) => execFileSync('git', a, { cwd, encoding: 'utf8' });
  const remote = path.join(tmp, 'remote.git');
  fs.mkdirSync(remote);
  g(remote, 'init', '--bare', '-b', 'main');
  const work = path.join(tmp, 'ws', 'REPX');
  fs.mkdirSync(work, { recursive: true });
  g(work, 'init', '-b', 'main');
  g(work, 'config', 'user.email', 't@example.com');
  g(work, 'config', 'user.name', 't');
  fs.writeFileSync(path.join(work, 'a.txt'), 'line1\n');
  g(work, 'add', '-A');
  g(work, 'commit', '-m', 'init');
  g(work, 'remote', 'add', 'origin', remote);
  g(work, 'push', '-u', 'origin', 'main');

  const repo = (await api('POST', '/api/repositories', { projectId: pid, url: 'https://github.com/o/r', defaultBranch: 'main', worktreeRoot: 'REPX' })).body;
  const post = (p: string, b: object = {}) => api('POST', `/api/git/${p}`, { repositoryId: repo.id, ...b });
  assert.equal(repo.currentBranch, 'main');
  assert.equal((await api('GET', `/api/git/status?repositoryId=${repo.id}`)).body.clean, true);

  assert.equal((await post('commit', { message: 'nothing' })).status, 409);
  fs.writeFileSync(path.join(work, 'b.txt'), 'b\n');
  const c = await post('commit', { message: 'add b' });
  assert.equal(c.status, 200);
  assert.match(c.body.commit, /^[0-9a-f]{7,}$/);

  const br = await post('branch', { name: 'feature/x', checkout: true });
  assert.equal(br.body.branch, 'feature/x');
  assert.equal(db.get('repositories', repo.id)?.currentBranch, 'feature/x', 'DBの現在ブランチが同期される');
  fs.writeFileSync(path.join(work, 'f.txt'), 'f\n');
  await post('commit', { message: 'feature' });
  assert.equal((await post('checkout', { branch: 'main' })).body.branch, 'main');
  const mg = await post('merge', { source: 'feature/x' });
  assert.equal(mg.status, 200);
  assert.ok(fs.existsSync(path.join(work, 'f.txt')));
  const list = (await api('GET', `/api/git/branches?repositoryId=${repo.id}`)).body.items;
  assert.ok(list.some((b: any) => b.name === 'feature/x') && list.find((b: any) => b.current).name === 'main');

  // 競合: 同じ行を別々に変更 → 409 で中止し、作業ツリーが元に戻る
  await post('branch', { name: 'left' });
  await post('branch', { name: 'right' });
  await post('checkout', { branch: 'left' });
  fs.writeFileSync(path.join(work, 'a.txt'), 'LEFT\n');
  await post('commit', { message: 'left' });
  await post('checkout', { branch: 'right' });
  fs.writeFileSync(path.join(work, 'a.txt'), 'RIGHT\n');
  await post('commit', { message: 'right' });
  const conflict = await post('merge', { source: 'left' });
  assert.equal(conflict.status, 409);
  assert.equal(g(work, 'status', '--porcelain'), '', '競合後も作業ツリーはクリーン');
  assert.equal(fs.readFileSync(path.join(work, 'a.txt'), 'utf8'), 'RIGHT\n');

  await post('checkout', { branch: 'main' });
  assert.equal((await post('push')).status, 200);
  assert.equal((await post('fetch')).status, 200);
  assert.equal((await post('pull')).status, 200);
  assert.equal((await post('tag', { tag: 'v0.1.0', message: 'first' })).status, 200);
  assert.equal((await post('tag', { tag: 'v0.1.0' })).status, 409, '重複タグ');
  assert.ok(g(work, 'tag').includes('v0.1.0'));

  const wt = await post('worktree', { branch: 'wt-branch', path: 'wt1', base: 'main' });
  assert.equal(wt.status, 200);
  assert.ok(fs.existsSync(path.join(tmp, 'ws', 'wt1', 'a.txt')));
  const wts = (await api('GET', `/api/git/worktrees?repositoryId=${repo.id}`)).body.items;
  assert.ok(wts.some((w: any) => w.branch === 'wt-branch'));
});

test('Git: 安全性(パストラバーサル・オプション注入・URL制限)と未登録リポジトリ', async () => {
  const f = (b: object, p = 'fetch') => api('POST', `/api/git/${p}`, b);
  assert.equal((await f({ repositoryId: 'X', url: 'https://example.com/a.git', worktreeRoot: '../evil' })).status, 400);
  assert.equal((await f({ repositoryId: 'X', url: 'https://example.com/a.git', worktreeRoot: '/etc' })).status, 400);
  assert.equal((await f({ repositoryId: '../X', url: 'https://example.com/a.git' })).status, 400);
  assert.equal((await f({ repositoryId: 'NEW', url: 'file:///etc/passwd' })).status, 400, 'file:// はclone不可');
  assert.equal((await f({ repositoryId: 'NEW', url: '--upload-pack=touch /tmp/pwned' })).status, 400);
  assert.equal((await f({ repositoryId: 'NEW' })).status, 400, 'url 必須');
  assert.equal((await f({ repositoryId: 'REPX', branch: '--upload-pack=x' }, 'push')).status, 400, 'ローカルにあるが未登録でもURL必須');
  const regd = (await api('GET', `/api/repositories?projectId=${pid}`)).body.items[0];
  assert.equal((await f({ repositoryId: regd.id, name: '--orphan' }, 'branch')).status, 400);
  assert.equal((await f({ repositoryId: regd.id, branch: 'a..b' }, 'checkout')).status, 400);
  // クライアントが従来どおり送る形式(未登録ID + url + worktreeRoot)で、既存のローカルリポジトリを扱える
  const legacy = await f({ repositoryId: 'LEGACY', url: 'https://github.com/o/r', worktreeRoot: 'REPX' });
  assert.equal(legacy.status, 200, JSON.stringify(legacy.body));
  assert.equal((await f({ repositoryId: 'GONE', url: 'https://github.com/o/r', worktreeRoot: 'nope', branch: 'main' }, 'checkout')).status, 404, 'ローカルにないリポジトリは操作できない(cloneはFetch/Pullのみ)');
});

test('Pull Request / Release: マージ日時の記録とタグ重複', async () => {
  const p2 = (await api('POST', '/api/projects', { name: 'P2', rootPath: './d' })).body.id;
  const repo = (await api('POST', '/api/repositories', { projectId: p2, url: 'https://github.com/o/r2', worktreeRoot: 'R2' })).body.id;
  const pr = (await api('POST', '/api/pull-requests', { projectId: p2, repositoryId: repo, title: 'PR', sourceBranch: 'f', mergedAt: '2000-01-01' })).body;
  assert.equal(pr.mergedAt, '', '作成時に mergedAt は指定できない');
  const merged = (await api('PATCH', `/api/pull-requests/${pr.id}`, { status: 'MERGED', mergedAt: '2000-01-01' })).body;
  assert.equal(merged.status, 'MERGED');
  assert.ok(merged.mergedAt.startsWith('20') && merged.mergedAt !== '2000-01-01', 'マージ日時はサーバーが記録する');
  const again = (await api('PATCH', `/api/pull-requests/${pr.id}`, { reviewNote: 'ok' })).body;
  assert.equal(again.mergedAt, merged.mergedAt, '再更新しても日時は変わらない');
  assert.equal((await api('POST', '/api/releases', { projectId: p2, repositoryId: repo, tag: 'v1' })).status, 201);
  assert.equal((await api('POST', '/api/releases', { projectId: p2, repositoryId: repo, tag: 'v1' })).status, 409);
  assert.equal((await api('DELETE', `/api/projects/${p2}`)).status, 204);
});

test('認証: API_TOKEN 設定時は Bearer 必須', async () => {
  const app = createApp(loadConfig({ DATA_DIR: path.join(tmp, 'd3'), API_TOKEN: 'secret' }));
  await new Promise<void>((r) => app.server.listen(0, r));
  const o = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  assert.equal((await call(o, 'GET', '/api/health')).status, 200);
  assert.equal((await call(o, 'GET', '/api/projects')).status, 401);
  assert.equal((await call(o, 'GET', '/api/projects', undefined, { authorization: 'Bearer wrong' })).status, 401);
  assert.equal((await call(o, 'GET', '/api/projects', undefined, { authorization: 'Bearer secret' })).status, 200);
  app.server.close();
});

test('削除: 関連データのカスケードと、案件フォルダの退避', async () => {
  const before = (await api('GET', `/api/traceability?projectId=${pid}`)).body.total;
  assert.ok(before > 0);
  assert.equal((await api('DELETE', `/api/work-items/${taskId}`)).status, 204);
  const ids = (await api('GET', `/api/traceability?projectId=${pid}`)).body.items.flatMap((t: any) => [t.sourceId, t.targetId]);
  assert.ok(!ids.includes(taskId), '削除した項目の関連付けも消える');
  assert.equal((await api('GET', '/api/traceability')).status, 400, '案件を指定しない一覧は400');

  const folder = path.join(cfg.dataDir, 'projects', pid);
  assert.ok(fs.existsSync(path.join(folder, 'project.json')));
  assert.equal((await api('DELETE', `/api/projects/${pid}`)).status, 204);
  assert.ok(!fs.existsSync(folder), '案件フォルダは projects/ から無くなる');
  assert.ok(fs.readdirSync(path.join(cfg.dataDir, 'trash')).some((n) => n.startsWith(pid)), 'trash/ に退避されている');
  for (const seg of ['contexts', 'work-items', 'artifacts', 'executions', 'traceability', 'repositories', 'prompts']) {
    assert.equal((await api('GET', `/api/${seg}?projectId=${pid}`)).status, 404, `${seg}`);
  }
});
