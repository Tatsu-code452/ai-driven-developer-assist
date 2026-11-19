// C-002: 横断検索。
//  1) インデックス検索: 各案件の index.json(ID・タイトル・タグ・本文冒頭)だけを見る。案件データを読み込まないので速く、全案件を対象にできる
//  2) 全文検索(deep): 案件データを読み込み、本文全体を走査する。案件を指定した検索では既定で有効
import type { Database } from './db.ts';
import { TEXT_FIELDS, type PCollKey } from './project-store.ts';

export interface Hit {
  projectId: string;
  collection: PCollKey;
  /** 種別(workItems なら TASK/BUG/QA など)と成果物の出所。画面遷移先の判定に使う */
  type: string;
  origin: string;
  id: string;
  title: string;
  matched: 'id' | 'title' | 'tags' | 'excerpt' | 'content';
  snippet: string;
  score: number;
}

const around = (text: string, needle: string): string => {
  const i = text.toLowerCase().indexOf(needle);
  if (i < 0) return text.slice(0, 90);
  return text.slice(Math.max(0, i - 30), i + needle.length + 60).replace(/\s+/g, ' ');
};

export function searchWorkspace(db: Database, q: string, opts: { projectId?: string; deep?: boolean; limit?: number }) {
  const needle = q.trim().toLowerCase();
  const limit = opts.limit ?? 50;
  const stores = opts.projectId ? [db.storeOf(opts.projectId)] : db.allStores();
  const deep = opts.deep ?? Boolean(opts.projectId);
  const hits = new Map<string, Hit & { updatedAt: string }>();

  for (const p of stores) {
    for (const e of p.entries.values()) {
      let matched: Hit['matched'] | '' = '';
      let score = 0;
      let snippet = e.title;
      if (e.id.toLowerCase() === needle) { matched = 'id'; score = 5; }
      else if (e.title.toLowerCase().includes(needle)) { matched = 'title'; score = 3; }
      else if (e.tags.some((t) => t.toLowerCase().includes(needle))) { matched = 'tags'; score = 2; snippet = e.tags.join(', '); }
      else if (e.excerpt.toLowerCase().includes(needle)) { matched = 'excerpt'; score = 1; snippet = around(e.excerpt, needle); }
      if (matched) hits.set(e.id, { projectId: p.id, collection: e.c, type: e.type, origin: e.origin, id: e.id, title: e.title, matched, snippet, score, updatedAt: e.updatedAt });
    }
  }

  if (deep) {
    for (const p of stores) {
      const d = db.dataOf(p);
      for (const [k, fields] of Object.entries(TEXT_FIELDS) as [PCollKey, string[]][]) {
        for (const r of d[k]) {
          if (hits.has(r.id)) continue;
          for (const f of fields) {
            const text = typeof r[f] === 'string' ? (r[f] as string) : '';
            if (text.toLowerCase().includes(needle)) {
              const en = p.entries.get(r.id);
              const title = en?.title ?? r.id;
              hits.set(r.id, { projectId: p.id, collection: k, type: en?.type ?? '', origin: en?.origin ?? '', id: r.id, title, matched: 'content', snippet: around(text, needle), score: 1, updatedAt: r.updatedAt });
              break;
            }
          }
        }
      }
    }
  }

  const items = [...hits.values()]
    .sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
    .map(({ updatedAt: _u, ...h }) => h);
  return {
    mode: deep ? 'full' : 'index',
    scannedProjects: stores.length,
    items,
    ...(deep ? {} : { note: 'インデックス検索です(ID・タイトル・タグ・本文冒頭300文字が対象)。本文全体を探すには deep=1 を指定してください。' }),
  };
}
