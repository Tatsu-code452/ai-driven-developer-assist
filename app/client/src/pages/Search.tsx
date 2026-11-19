import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api';
import { useStore } from '../store';
import { Badge, Empty, PageHeader, RequireProject, Table, useToast } from '../ui';
import { errMsg } from '../util';

interface Hit {
  projectId: string; collection: string; type: string; origin: string; id: string; title: string;
  matched: 'id' | 'title' | 'tags' | 'excerpt' | 'content'; snippet: string; score: number;
}
interface Result { mode: 'index' | 'full'; scannedProjects: number; items: Hit[]; note?: string }

const COLLECTION_LABEL: Record<string, string> = {
  contexts: 'コンテキスト', workItems: 'タスク/課題/QA', artifacts: '成果物', prompts: 'プロンプト', executions: 'AI実行',
  repositories: 'リポジトリ', branches: 'ブランチ', pullRequests: 'Pull Request', releases: 'リリース',
};
const MATCH_LABEL: Record<Hit['matched'], string> = { id: 'ID', title: 'タイトル', tags: 'タグ', excerpt: '本文冒頭', content: '本文' };

function pathOf(h: Hit): string {
  switch (h.collection) {
    case 'contexts': return `/contexts/${h.id}`;
    case 'workItems': return h.type === 'BUG' ? `/issues/${h.id}` : h.type === 'QA' ? `/qa/${h.id}` : `/tasks/${h.id}`;
    case 'artifacts': return `${h.origin === 'AI' ? '/ai-artifacts' : '/documents'}/${h.id}`;
    case 'prompts': return '/prompts';
    case 'executions': return '/executions';
    case 'repositories': return '/git/repositories';
    case 'branches': return '/git/branches';
    case 'pullRequests': return '/git/pull-requests';
    case 'releases': return '/git/releases';
    default: return '/traceability';
  }
}

function Body() {
  const { currentProject, setCurrentProject, data } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<'project' | 'all'>('project');
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const nameOf = (id: string) => data.projects.find((p) => p.id === id)?.name ?? id;

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const params = new URLSearchParams({ q: q.trim() });
      // 作業中の案件は本文全体を検索。全案件はインデックス(タイトル・タグ・本文冒頭)を検索する
      if (scope === 'project') params.set('projectId', currentProject!.id);
      setRes(await http<Result>('GET', `/api/search?${params}`));
    } catch (err) {
      toast(errMsg(err), 'bad');
    } finally {
      setBusy(false);
    }
  };
  const open = (h: Hit) => {
    if (h.projectId !== currentProject?.id) setCurrentProject(h.projectId); // 別案件の結果は、その案件に切り替えてから開く
    nav(pathOf(h));
  };

  return (
    <>
      <form className="toolbar" onSubmit={run}>
        <input type="search" className="search" style={{ minWidth: 320 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="キーワード" aria-label="キーワード" />
        <select className="filter" value={scope} onChange={(e) => setScope(e.target.value as 'project' | 'all')} aria-label="検索範囲">
          <option value="project">作業中の案件(本文全体)</option>
          <option value="all">すべての案件(タイトル・タグ・本文冒頭)</option>
        </select>
        <button className="btn primary" disabled={busy || !q.trim()}>{busy ? '検索中…' : '検索'}</button>
      </form>
      {res && (
        <>
          <p className="muted">{res.items.length} 件(対象 {res.scannedProjects} 案件)。{res.note}</p>
          <Table
            rows={res.items}
            onRowClick={open}
            empty={<Empty title="該当するデータがありません" />}
            columns={[
              { header: '案件', render: (h) => <>{nameOf(h.projectId)} <span className="id">{h.projectId}</span></> },
              { header: '種別', render: (h) => COLLECTION_LABEL[h.collection] ?? h.collection },
              { header: 'タイトル', render: (h) => <><span className="id">{h.id}</span> {h.title}</> },
              { header: '一致', render: (h) => <Badge tone={h.matched === 'content' ? 'info' : 'neutral'}>{MATCH_LABEL[h.matched]}</Badge> },
              { header: '抜粋', render: (h) => h.snippet },
            ]}
          />
        </>
      )}
    </>
  );
}

export default function Search() {
  return (
    <>
      <PageHeader title="横断検索" />
      <RequireProject><Body /></RequireProject>
    </>
  );
}
