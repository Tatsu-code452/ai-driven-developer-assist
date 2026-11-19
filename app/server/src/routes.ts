import type { Config } from './config.ts';
import type { Database } from './db.ts';
import { HttpError } from './errors.ts';
import { Router, parseMultipart, readBody, UPLOAD_LIMIT, type Ctx } from './http.ts';
import { COLLECTIONS, SCHEMAS, type CollKey, type Rec } from './schemas.ts';
import { assertProject, buildMatrix, compareExecutions, dashboard, nodeOf, orphans, reachable, renderPrompt } from './domain.ts';
import { searchWorkspace } from './search.ts';
import { convertToText } from './convert.ts';
import { executeAI, type FetchFn } from './ai.ts';
import * as git from './git.ts';

const str = (v: unknown, name: string, required = true): string => {
  if (v === undefined || v === null || v === '') {
    if (required) throw new HttpError(400, `${name} は必須です`);
    return '';
  }
  if (typeof v !== 'string') throw new HttpError(400, `${name} は文字列で指定してください`);
  return v;
};
const intParam = (v: string | null, def: number, min: number, max: number) => {
  const n = v === null ? def : Number(v);
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : def;
};

export function buildRouter(db: Database, cfg: Config, deps: { fetch: FetchFn }): Router {
  const r = new Router();

  r.get('/api/health', () => ({ body: { status: 'ok', time: new Date().toISOString() } }));

  /* ---------- F-014 ダッシュボード / C-002 横断検索 ---------- */
  r.get('/api/dashboard', (c) => ({ body: dashboard(db, assertProject(db, c.query.get('projectId'))) }));
  r.get('/api/search', (c) => {
    const q = (c.query.get('q') ?? '').trim();
    if (!q) throw new HttpError(400, 'q を指定してください');
    const projectId = c.query.get('projectId') ?? undefined;
    if (projectId) assertProject(db, projectId);
    const deep = c.query.get('deep');
    return { body: searchWorkspace(db, q, { projectId, deep: deep === null ? undefined : deep === '1' || deep === 'true', limit: intParam(c.query.get('limit'), 50, 1, 500) }) };
  });

  /* ---------- 案件フォルダの管理(オーケストレーション) ---------- */
  r.get('/api/workspace', () => ({ body: db.workspaceSummary() }));
  r.get('/api/projects/:id/stats', (c) => ({ body: db.stats(assertProject(db, c.params.id)) }));
  r.post('/api/projects/:id/reindex', (c) => {
    const r2 = db.reindex(assertProject(db, c.params.id));
    db.log('reindex', 'projects', c.params.id, `entries=${r2.entries}`);
    return { body: r2 };
  });

  /* ---------- F-006 プロンプト ---------- */
  r.post('/api/prompts/:id/render', async (c) => {
    const b = await c.json();
    const ids = b.contextIds === undefined ? [] : b.contextIds;
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) throw new HttpError(400, 'contextIds は文字列配列で指定してください');
    return { body: renderPrompt(db, c.params.id, { workItemId: str(b.workItemId, 'workItemId', false), contextIds: ids as string[], outputFormat: str(b.outputFormat, 'outputFormat', false) }) };
  });

  /* ---------- F-008 成果物のレビュー・承認 ---------- */
  const transition = (id: string, from: string[], to: string, approved: boolean | null, note: unknown) => {
    const a = db.require('artifacts', id, '成果物');
    if (!from.includes(a.status as string)) throw new HttpError(409, `状態が「${a.status}」の成果物には実行できません(${from.join(' / ')} のときのみ)`);
    const fields: Record<string, unknown> = { status: to };
    if (approved !== null) fields.approved = approved;
    if (typeof note === 'string' && note) fields.reviewNote = note;
    return db.setInternal('artifacts', id, fields, `artifact:${to.toLowerCase()}`);
  };
  r.post('/api/artifacts/:id/review', async (c) => ({ body: transition(c.params.id, ['DRAFT'], 'REVIEW', null, (await c.json()).reviewNote) }));
  r.post('/api/artifacts/:id/approve', async (c) => ({ body: transition(c.params.id, ['REVIEW'], 'APPROVED', true, (await c.json()).reviewNote) }));
  r.post('/api/artifacts/:id/baseline', async (c) => ({ body: transition(c.params.id, ['APPROVED'], 'BASELINE', null, (await c.json()).reviewNote) }));
  r.post('/api/artifacts/:id/reject', async (c) => ({ body: transition(c.params.id, ['REVIEW', 'APPROVED', 'BASELINE'], 'DRAFT', false, (await c.json()).reviewNote) }));
  r.get('/api/artifacts/:id/versions', (c) => {
    const a = db.require('artifacts', c.params.id, '成果物');
    return { body: { current: { version: a.version, content: a.content, savedAt: a.updatedAt }, history: a.versions } };
  });

  /* ---------- F-007 AI実行 ---------- */
  r.get('/api/executions/compare', (c) => ({ body: compareExecutions(db, str(c.query.get('a'), 'a'), str(c.query.get('b'), 'b')) }));
  r.post('/api/executions/:id/artifact', async (c) => {
    const e = db.require('executions', c.params.id, 'AI実行');
    const b = await c.json();
    if (!(e.responseText as string).trim()) throw new HttpError(400, '回答が保存されていない実行は成果物にできません');
    const art = db.create('artifacts', {
      projectId: e.projectId, workItemId: e.workItemId, artifactType: b.artifactType ?? 'DESIGN', title: str(b.title, 'title'),
      path: str(b.path, 'path', false), content: e.responseText, origin: 'AI',
    });
    const traces = [db.create('traces', { projectId: e.projectId, sourceId: e.id, targetId: art.id, relationType: 'OUTPUT' })];
    if (e.workItemId && db.get('workItems', e.workItemId as string)) traces.push(db.create('traces', { projectId: e.projectId, sourceId: e.workItemId, targetId: art.id, relationType: 'OUTPUT' }));
    return { status: 201, body: { artifact: art, traces } };
  });
  r.post('/api/ai/execute', async (c) => {
    const b = await c.json();
    const prompt = str(b.prompt, 'prompt');
    if (prompt.length > 200_000) throw new HttpError(413, 'prompt が長すぎます(上限 200,000 文字)');
    const { response, model } = await executeAI(cfg, deps.fetch, str(b.aiType, 'aiType'), prompt);
    let execution: Rec | undefined;
    const save = b.save as Record<string, unknown> | undefined;
    if (save) {
      execution = db.create('executions', {
        projectId: save.projectId, workItemId: save.workItemId, promptId: save.promptId, contextIds: save.contextIds,
        requestText: prompt, responseText: response, aiType: b.aiType,
      });
    }
    return { body: { response, model, ...(execution ? { execution } : {}) } };
  });

  /* ---------- F-003 ファイル変換 ---------- */
  r.post('/api/convert', async (c) => {
    const ct = c.req.headers['content-type'] ?? '';
    if (!/^multipart\/form-data/i.test(ct)) throw new HttpError(400, 'multipart/form-data で file を送ってください');
    const { fields, files } = parseMultipart(await c.buffer(UPLOAD_LIMIT), ct);
    const f = files.find((x) => x.name === 'file') ?? files[0];
    if (!f) throw new HttpError(400, 'file が含まれていません');
    const text = convertToText(f.filename, f.data);
    let artifact: Rec | undefined;
    if (fields.projectId) { // F-003-004 変換結果のドキュメント登録
      artifact = db.create('artifacts', {
        projectId: fields.projectId, artifactType: fields.artifactType || 'REQUIREMENT', title: fields.title || f.filename.replace(/\.[^.]+$/, ''),
        path: f.filename, content: text, origin: 'CONVERTED',
      });
    }
    return { body: { text, filename: f.filename, ...(artifact ? { artifact } : {}) } };
  });

  /* ---------- タスク生成 (運用フロー: コンテキスト→タスク / 課題→対応タスク) ---------- */
  r.post('/api/contexts/:id/task', async (c) => {
    const ctx = db.require('contexts', c.params.id, 'コンテキスト');
    const b = await c.json();
    const t = db.create('workItems', {
      projectId: ctx.projectId, type: 'TASK', title: str(b.title, 'title', false) || `${ctx.title} の分析`, description: `コンテキスト ${ctx.id} (${ctx.title}) をもとに実施する。`, status: 'TODO',
    });
    const trace = db.create('traces', { projectId: ctx.projectId, sourceId: ctx.id, targetId: t.id, relationType: 'INPUT' });
    return { status: 201, body: { task: t, trace } };
  });
  r.post('/api/work-items/:id/fix-task', async (c) => {
    const bug = db.require('workItems', c.params.id, '課題');
    if (bug.type !== 'BUG') throw new HttpError(409, '対応タスクを生成できるのは課題(BUG)のみです');
    const b = await c.json();
    const t = db.create('workItems', {
      projectId: bug.projectId, type: 'FIX', title: str(b.title, 'title', false) || `対応: ${bug.title}`, description: `課題 ${bug.id} の対応タスク。`,
      status: 'TODO', priority: bug.priority, assignee: bug.assignee, parentId: bug.id,
    });
    const trace = db.create('traces', { projectId: bug.projectId, sourceId: t.id, targetId: bug.id, relationType: 'FIXES' });
    return { status: 201, body: { task: t, trace } };
  });

  /* ---------- F-012 トレーサビリティ分析 ---------- */
  r.get('/api/traceability/matrix', (c) => ({ body: buildMatrix(db, assertProject(db, c.query.get('projectId'))) }));
  r.get('/api/traceability/gaps', (c) => {
    const pid = assertProject(db, c.query.get('projectId'));
    const m = buildMatrix(db, pid);
    return { body: { unlinked: orphans(db, pid), missing: m.missing, coverage: m.coverage } };
  });
  r.get('/api/traceability/impact/:id', (c) => {
    const start = c.params.id;
    if (!db.find(start)) throw new HttpError(404, `${start} が見つかりません`);
    const depth = intParam(c.query.get('depth'), 3, 1, 10);
    const items = [...reachable(db, start, depth).entries()].sort((a, b) => a[1] - b[1]).map(([id, distance]) => ({ ...nodeOf(db, id), distance }));
    return { body: { id: start, depth, items } };
  });

  /* ---------- F-013 Git ---------- */
  const repoOf = (b: Record<string, unknown>, q: URLSearchParams): { info: git.RepoInfo; saved?: Rec } => {
    const id = str(b.repositoryId ?? q.get('repositoryId'), 'repositoryId');
    const saved = db.get('repositories', id);
    if (saved) return { saved, info: { id, url: saved.url as string, worktreeRoot: saved.worktreeRoot as string, defaultBranch: saved.defaultBranch as string } };
    // サーバー未登録のリポジトリ(クライアント側のみの記録)は、送られたURL/パスを同じ安全検査にかけて扱う
    if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new HttpError(400, 'repositoryId が不正です');
    return { info: { id, url: str(b.url, 'url'), worktreeRoot: str(b.worktreeRoot, 'worktreeRoot', false), defaultBranch: 'main' } };
  };
  const gitRoute = (path: string, method: 'get' | 'post', fn: (ri: git.RepoInfo, b: Record<string, unknown>) => Promise<Record<string, unknown>>) => {
    const h = async (c: Ctx) => {
      const b = method === 'post' ? await c.json() : {};
      const { info, saved } = repoOf(b, c.query);
      const result = await fn(info, b);
      if (saved && typeof result.branch === 'string' && result.branch && result.branch !== saved.currentBranch) {
        db.update('repositories', saved.id, { currentBranch: result.branch });
      }
      db.log(`git:${path.split('/').pop()}`, 'repositories', info.id);
      return { body: result };
    };
    r[method](`/api/git/${path}`, h);
  };
  gitRoute('fetch', 'post', (i) => git.fetchRepo(cfg, i));
  gitRoute('pull', 'post', (i) => git.pullRepo(cfg, i));
  gitRoute('status', 'get', (i) => git.statusRepo(cfg, i));
  gitRoute('branches', 'get', async (i) => ({ items: await git.listBranches(cfg, i) }));
  gitRoute('commit', 'post', (i, b) => git.commitRepo(cfg, i, str(b.message, 'message'), Array.isArray(b.paths) ? (b.paths as string[]) : undefined));
  gitRoute('push', 'post', (i, b) => git.pushRepo(cfg, i, str(b.branch, 'branch', false) || undefined));
  gitRoute('branch', 'post', (i, b) => git.createBranch(cfg, i, str(b.name, 'name'), str(b.base, 'base', false) || undefined, b.checkout === true));
  gitRoute('checkout', 'post', (i, b) => git.checkoutBranch(cfg, i, str(b.branch, 'branch')));
  gitRoute('merge', 'post', (i, b) => git.mergeBranch(cfg, i, str(b.source, 'source'), str(b.into, 'into', false) || undefined));
  gitRoute('tag', 'post', (i, b) => git.tagRepo(cfg, i, str(b.tag, 'tag'), str(b.message, 'message', false) || undefined));
  gitRoute('worktree', 'post', (i, b) => git.addWorktree(cfg, i, str(b.branch, 'branch'), str(b.path, 'path'), str(b.base, 'base', false) || undefined));
  gitRoute('worktrees', 'get', async (i) => ({ items: await git.listWorktrees(cfg, i) }));

  /* ---------- C-004 監査ログ / C-005 設定 ---------- */
  r.get('/api/audit', (c) => {
    const limit = intParam(c.query.get('limit'), 100, 1, 1000);
    const items = db.readAudit({ projectId: c.query.get('projectId') ?? undefined, entityId: c.query.get('entityId') ?? undefined, limit });
    return { body: { items, total: items.length } };
  });
  r.get('/api/settings', () => ({ body: db.settings }));
  r.put('/api/settings', async (c) => {
    const b = await c.json();
    const entries = Object.entries(b);
    if (entries.some(([k, v]) => typeof v !== 'string' || k.length > 100 || v.length > 1000)) throw new HttpError(400, '設定は文字列(キー100文字・値1000文字以内)で指定してください');
    if (Object.keys({ ...db.settings, ...b }).length > 200) throw new HttpError(400, '設定の数が上限(200)を超えます');
    return { body: db.setSettings(b as Record<string, string>) };
  });

  /* ---------- 共通CRUD(個別ルートより後ろに登録する) ---------- */
  for (const [seg, k] of Object.entries(COLLECTIONS) as [string, CollKey][]) {
    r.get(`/api/${seg}`, (c) => {
      const schema = SCHEMAS[k];
      const q = (c.query.get('q') ?? '').toLowerCase();
      let rows = db.list(k, c.query.get('projectId') ?? undefined).filter((rec) => {
        for (const [name, value] of c.query) {
          if ((name === 'projectId' && k !== 'projects') || name in schema) {
            if (String(rec[name]) !== value) return false;
          }
        }
        return !q || Object.values(rec).some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
      });
      const total = rows.length;
      const offset = intParam(c.query.get('offset'), 0, 0, 1_000_000);
      const limit = intParam(c.query.get('limit'), 200, 1, 1000);
      rows = rows.slice(offset, offset + limit);
      return { body: { items: rows, total } };
    });
    r.post(`/api/${seg}`, async (c) => ({ status: 201, body: db.create(k, await c.json()) }));
    r.get(`/api/${seg}/:id`, (c) => ({ body: db.require(k, c.params.id) }));
    r.patch(`/api/${seg}/:id`, async (c) => ({ body: db.update(k, c.params.id, await c.json()) }));
    r.delete(`/api/${seg}/:id`, (c) => { db.remove(k, c.params.id); return { status: 204 }; });
  }
  return r;
}

export { readBody };
