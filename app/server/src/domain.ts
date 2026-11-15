// 業務ロジック(プロンプト生成・トレーサビリティ分析・集計・検索)
import type { Database } from './db.ts';
import { HttpError } from './errors.ts';
import type { CollKey, Rec } from './schemas.ts';

const ROLE_LABEL: Record<string, string> = {
  PM: 'PM', REQ: '要件定義', ARCH: 'アーキテクト', DB: 'DB設計', UI: 'UI設計', DES: '詳細設計',
  BE: 'バックエンド', FE: 'フロントエンド', TEST: 'テスト', REVIEW: 'レビュー',
};
const s = (r: Rec, k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');

/** F-006-001〜004: テンプレートへのコンテキスト/タスク/出力形式の展開 */
export function renderPrompt(db: Database, promptId: string, opt: { workItemId?: string; contextIds?: string[]; outputFormat?: string }) {
  const tpl = db.require('prompts', promptId, 'プロンプト');
  const wi = opt.workItemId ? db.require('workItems', opt.workItemId, 'タスク') : undefined;
  const ctxs = (opt.contextIds ?? []).map((id) => db.require('contexts', id, 'コンテキスト'));
  const parts: [string, string, string][] = [
    ['role', ROLE_LABEL[s(tpl, 'role')] ?? s(tpl, 'role'), ''],
    ['task', wi ? `[${wi.id}] ${s(wi, 'title')}\n${s(wi, 'description')}`.trim() : '(タスク未指定)', 'タスク'],
    ['contexts', ctxs.length ? ctxs.map((c) => `### ${s(c, 'title')} (${c.id})\n${s(c, 'content')}`).join('\n\n') : '(コンテキスト未指定)', 'コンテキスト'],
    ['outputFormat', opt.outputFormat?.trim() || s(tpl, 'outputFormat'), '出力形式'],
  ];
  let text = s(tpl, 'template');
  for (const [key, value, heading] of parts) {
    const token = `{{${key}}}`;
    if (text.includes(token)) text = text.split(token).join(value);
    else if (heading) text += `\n\n## ${heading}\n${value}`;
  }
  return { prompt: text, promptId, workItemId: wi?.id ?? '', contextIds: ctxs.map((c) => c.id) };
}

/** トレーサビリティを無向グラフとみなして到達可能な項目と距離を返す(影響分析/網羅性) */
export function reachable(db: Database, start: string, maxDepth: number): Map<string, number> {
  const traces = db.list('traces');
  const dist = new Map<string, number>([[start, 0]]);
  let frontier = [start];
  for (let d = 1; d <= maxDepth && frontier.length; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const t of traces) {
        const other = t.sourceId === id ? (t.targetId as string) : t.targetId === id ? (t.sourceId as string) : null;
        if (other && !dist.has(other)) { dist.set(other, d); next.push(other); }
      }
    }
    frontier = next;
  }
  dist.delete(start);
  return dist;
}

const DESIGN_TYPES = ['DESIGN', 'SCREEN', 'DATABASE', 'API'];
export interface Node { id: string; collection: CollKey | 'unknown'; title: string; category: string }
export function nodeOf(db: Database, id: string): Node {
  const f = db.find(id);
  if (!f) return { id, collection: 'unknown', title: '(削除済み)', category: 'UNKNOWN' };
  const r = f.rec;
  switch (f.k) {
    case 'contexts': return { id, collection: f.k, title: s(r, 'title'), category: 'CONTEXT' };
    case 'workItems': return { id, collection: f.k, title: s(r, 'title'), category: s(r, 'type') };
    case 'artifacts': {
      const t = s(r, 'artifactType');
      return { id, collection: f.k, title: s(r, 'title'), category: DESIGN_TYPES.includes(t) ? 'DESIGN' : t === 'SOURCE' ? 'SOURCE' : t === 'TEST' ? 'TEST' : 'OTHER_ARTIFACT' };
    }
    case 'prompts': return { id, collection: f.k, title: s(r, 'name'), category: 'PROMPT' };
    case 'executions': return { id, collection: f.k, title: `AI実行 ${s(r, 'executedAt')}`, category: 'EXECUTION' };
    case 'repositories': return { id, collection: f.k, title: s(r, 'url'), category: 'REPOSITORY' };
    default: return { id, collection: f.k, title: id, category: f.k.toUpperCase() };
  }
}

export const MATRIX_COLUMNS = [
  { key: 'TASK', label: 'タスク', required: true },
  { key: 'DESIGN', label: '設計', required: true },
  { key: 'SOURCE', label: 'ソース', required: true },
  { key: 'TEST', label: 'テスト', required: true },
  { key: 'BUG', label: '課題', required: false },
  { key: 'QA', label: 'QA', required: false },
];

/** F-012-003/004: 要件(コンテキスト)ごとの網羅性マトリクスと欠落 */
export function buildMatrix(db: Database, projectId: string) {
  const all = db.list('contexts').filter((c) => c.projectId === projectId);
  const reqs = all.filter((c) => c.type === 'REQUIREMENT');
  const rowsSrc = reqs.length ? reqs : all;
  const rows = rowsSrc.map((c) => {
    const found = [...reachable(db, c.id, 6).keys()].map((id) => nodeOf(db, id));
    const cells: Record<string, { id: string; title: string }[]> = {};
    for (const col of MATRIX_COLUMNS) cells[col.key] = found.filter((n) => n.category === col.key).map((n) => ({ id: n.id, title: n.title }));
    return { contextId: c.id, title: s(c, 'title'), cells };
  });
  const required = MATRIX_COLUMNS.filter((c) => c.required);
  const missing = rows.flatMap((r) => required.filter((c) => r.cells[c.key].length === 0).map((c) => ({ contextId: r.contextId, column: c.key })));
  const total = rows.length * required.length;
  return {
    columns: MATRIX_COLUMNS,
    usedAllContexts: reqs.length === 0 && all.length > 0,
    rows,
    missing,
    coverage: total ? Math.round(((total - missing.length) / total) * 100) : 0,
  };
}

/** 関連が1件もない項目(コンテキスト・タスク・成果物) */
export function orphans(db: Database, projectId: string): Node[] {
  const linked = new Set(db.list('traces').flatMap((t) => [t.sourceId as string, t.targetId as string]));
  return (['contexts', 'workItems', 'artifacts'] as CollKey[])
    .flatMap((k) => db.list(k).filter((r) => r.projectId === projectId && !linked.has(r.id)))
    .map((r) => nodeOf(db, r.id));
}

/** F-014: ダッシュボード集計 */
export function dashboard(db: Database, projectId: string) {
  const inProj = (k: CollKey) => db.list(k).filter((r) => r.projectId === projectId);
  const wi = inProj('workItems');
  const tasks = wi.filter((w) => ['TASK', 'REVIEW', 'FIX'].includes(w.type as string));
  const issues = wi.filter((w) => w.type === 'BUG');
  const qa = wi.filter((w) => w.type === 'QA');
  const arts = inProj('artifacts');
  const execs = inProj('executions');
  const count = <T,>(list: T[], f: (x: T) => string) => list.reduce<Record<string, number>>((m, x) => { const k = f(x); m[k] = (m[k] ?? 0) + 1; return m; }, {});
  const done = tasks.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;
  return {
    projectId,
    contexts: inProj('contexts').length,
    tasks: { total: tasks.length, byStatus: count(tasks, (t) => s(t, 'status')), doneRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0 },
    documents: arts.filter((a) => a.origin !== 'AI').length,
    aiArtifacts: arts.filter((a) => a.origin === 'AI').length,
    artifactsByStatus: count(arts, (a) => s(a, 'status')),
    issues: { total: issues.length, open: issues.filter((i) => i.status !== 'CLOSED').length },
    qa: { total: qa.length, unanswered: qa.filter((q) => q.status === 'OPEN').length },
    executions: { total: execs.length, byAiType: count(execs, (e) => s(e, 'aiType')) },
  };
}

/** C-002: 横断検索 */
export function search(db: Database, projectId: string, q: string, limit = 50) {
  const needle = q.toLowerCase();
  const targets: [CollKey, string[]][] = [
    ['contexts', ['title', 'content']], ['workItems', ['title', 'description', 'answer']], ['artifacts', ['title', 'path', 'content']],
    ['prompts', ['name', 'template']], ['executions', ['requestText', 'responseText']],
  ];
  const hits: { collection: string; id: string; title: string; snippet: string }[] = [];
  for (const [k, fields] of targets) {
    for (const r of db.list(k).filter((x) => x.projectId === projectId)) {
      for (const f of fields) {
        const text = s(r, f);
        const i = text.toLowerCase().indexOf(needle);
        if (i === -1) continue;
        hits.push({ collection: k, id: r.id, title: nodeOf(db, r.id).title, snippet: text.slice(Math.max(0, i - 30), i + needle.length + 60).replace(/\s+/g, ' ') });
        break;
      }
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}

/** F-007-004: 回答比較(行単位で相手側にない行を示す) */
export function compareExecutions(db: Database, aId: string, bId: string) {
  const a = db.require('executions', aId, 'AI実行');
  const b = db.require('executions', bId, 'AI実行');
  const al = s(a, 'responseText').split('\n');
  const bl = s(b, 'responseText').split('\n');
  const as = new Set(al);
  const bs = new Set(bl);
  return {
    a: { id: a.id, lines: al.map((text) => ({ text, onlyHere: !bs.has(text) })) },
    b: { id: b.id, lines: bl.map((text) => ({ text, onlyHere: !as.has(text) })) },
  };
}

export function assertProject(db: Database, projectId: string | null): string {
  if (!projectId) throw new HttpError(400, 'projectId を指定してください');
  db.require('projects', projectId, 'プロジェクト');
  return projectId;
}
