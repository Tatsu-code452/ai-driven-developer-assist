import type { Data } from './store';
import type { Context, Traceability, WorkItem } from './types';
import { PROMPT_ROLES, labelOf } from './meta';

export const formatDate = (iso: string) => (iso ? new Date(iso).toLocaleString('ja-JP') : '');
export const splitTags = (s: string) => s.split(/[,、\s]+/).map((x) => x.trim()).filter(Boolean);
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** F-006-001〜004: テンプレートにコンテキスト/タスク/出力形式を展開する */
export function buildPrompt(o: {
  template: string;
  role: string;
  task?: WorkItem;
  contexts: Context[];
  outputFormat: string;
}): string {
  const task = o.task ? `[${o.task.id}] ${o.task.title}\n${o.task.description}`.trim() : '(タスク未指定)';
  const contexts = o.contexts.length
    ? o.contexts.map((c) => `### ${c.title} (${c.id})\n${c.content}`).join('\n\n')
    : '(コンテキスト未指定)';
  const parts: [string, string, string][] = [
    ['role', labelOf(PROMPT_ROLES, o.role), ''],
    ['task', task, 'タスク'],
    ['contexts', contexts, 'コンテキスト'],
    ['outputFormat', o.outputFormat, '出力形式'],
  ];
  let text = o.template;
  for (const [key, value, heading] of parts) {
    const token = `{{${key}}}`;
    if (text.includes(token)) text = text.split(token).join(value);
    else if (heading) text += `\n\n## ${heading}\n${value}`;
  }
  return text;
}

/** トレーサビリティを無向グラフとみなし、起点から到達できる項目と距離を返す(影響分析/網羅性確認) */
export function reachable(traces: Traceability[], start: string, maxDepth = 3): Map<string, number> {
  const dist = new Map<string, number>([[start, 0]]);
  let frontier = [start];
  for (let d = 1; d <= maxDepth && frontier.length; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const t of traces) {
        const other = t.sourceId === id ? t.targetId : t.targetId === id ? t.sourceId : null;
        if (other && !dist.has(other)) {
          dist.set(other, d);
          next.push(other);
        }
      }
    }
    frontier = next;
  }
  dist.delete(start);
  return dist;
}

export interface NodeInfo {
  id: string;
  kind: 'Context' | 'WorkItem' | 'Prompt' | 'AIExecution' | 'Artifact' | 'Repository' | 'Unknown';
  label: string;
  /** マトリクス集計用の分類 */
  category: string;
  path: string;
}

const DESIGN_TYPES = ['DESIGN', 'SCREEN', 'DATABASE', 'API'];

export function nodeInfo(data: Data, id: string): NodeInfo {
  const c = data.contexts.find((x) => x.id === id);
  if (c) return { id, kind: 'Context', label: c.title, category: 'CONTEXT', path: `/contexts/${id}` };
  const w = data.workItems.find((x) => x.id === id);
  if (w) {
    const path = w.type === 'BUG' ? `/issues/${id}` : w.type === 'QA' ? `/qa/${id}` : `/tasks/${id}`;
    return { id, kind: 'WorkItem', label: w.title, category: w.type, path };
  }
  const a = data.artifacts.find((x) => x.id === id);
  if (a) {
    const category = DESIGN_TYPES.includes(a.artifactType) ? 'DESIGN'
      : a.artifactType === 'SOURCE' ? 'SOURCE'
      : a.artifactType === 'TEST' ? 'TEST' : 'OTHER_ARTIFACT';
    return { id, kind: 'Artifact', label: a.title, category, path: `${a.origin === 'AI' ? '/ai-artifacts' : '/documents'}/${id}` };
  }
  const p = data.prompts.find((x) => x.id === id);
  if (p) return { id, kind: 'Prompt', label: p.name, category: 'PROMPT', path: '/prompts' };
  const e = data.executions.find((x) => x.id === id);
  if (e) return { id, kind: 'AIExecution', label: `AI実行 ${formatDate(e.executedAt)}`, category: 'EXECUTION', path: '/executions' };
  const r = data.repositories.find((x) => x.id === id);
  if (r) return { id, kind: 'Repository', label: r.url, category: 'REPOSITORY', path: '/git/repositories' };
  return { id, kind: 'Unknown', label: '(削除済み)', category: 'UNKNOWN', path: '/traceability' };
}

export function allNodes(d: Data): NodeInfo[] {
  const ids = [
    ...d.contexts, ...d.workItems, ...d.artifacts, ...d.prompts, ...d.executions, ...d.repositories,
  ].map((x) => x.id);
  return ids.map((id) => nodeInfo(d, id));
}

/** F-007-004: 回答比較(行単位。相手側に存在しない行を強調) */
export function lineDiff(a: string, b: string) {
  const al = a.split('\n');
  const bl = b.split('\n');
  const as = new Set(al);
  const bs = new Set(bl);
  return {
    a: al.map((text) => ({ text, diff: !bs.has(text) })),
    b: bl.map((text) => ({ text, diff: !as.has(text) })),
  };
}
