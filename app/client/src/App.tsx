import { Link, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { useStore } from './store';
import { Empty } from './ui';
import Dashboard from './pages/Dashboard';
import { ProjectDetail, ProjectList } from './pages/Projects';
import { ContextDetail, ContextList, ContextRegister } from './pages/Contexts';
import { ArtifactDetail, ArtifactList } from './pages/Artifacts';
import Convert from './pages/Convert';
import { WorkItemDetail, WorkItemList } from './pages/WorkItems';
import Prompts from './pages/Prompts';
import Executions from './pages/Executions';
import { TraceList, TraceMatrix } from './pages/Traceability';
import { Branches, PullRequests, Releases, Repositories } from './pages/Git';

// 画面一覧の画面体系(開発フロー順)に合わせたナビゲーション
const NAV: { title: string; items: { to: string; label: string; end?: boolean }[] }[] = [
  { title: '', items: [{ to: '/', label: 'ダッシュボード', end: true }] },
  { title: 'プロジェクト管理', items: [{ to: '/projects', label: 'プロジェクト' }] },
  { title: '入力管理', items: [{ to: '/documents', label: 'ドキュメント' }, { to: '/convert', label: 'ファイル変換' }] },
  { title: 'コンテキスト管理', items: [{ to: '/contexts', label: 'コンテキスト' }] },
  { title: 'タスク管理', items: [{ to: '/tasks', label: 'タスク' }] },
  { title: 'AI実行管理', items: [
    { to: '/prompts', label: 'プロンプト生成' }, { to: '/executions', label: 'AI実行履歴' }, { to: '/ai-artifacts', label: 'AI成果物' },
  ] },
  { title: 'QA・課題管理', items: [{ to: '/qa', label: 'QA' }, { to: '/issues', label: '課題' }] },
  { title: 'トレーサビリティ', items: [
    { to: '/traceability', label: '一覧', end: true }, { to: '/traceability/matrix', label: 'マトリクス' },
  ] },
  { title: 'Git/GitHub管理', items: [
    { to: '/git/repositories', label: 'リポジトリ' }, { to: '/git/branches', label: 'ブランチ' },
    { to: '/git/pull-requests', label: 'Pull Request' }, { to: '/git/releases', label: 'リリース' },
  ] },
];

function Layout() {
  const { data, currentProject, setCurrentProject } = useStore();
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">AI駆動型<br />開発支援システム</div>
        <nav aria-label="メインメニュー">
          {NAV.map((g) => (
            <div className="nav-group" key={g.title || 'top'}>
              {g.title && <div className="nav-title">{g.title}</div>}
              <div className="nav-list">
                {g.items.map((i) => (
                  <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{i.label}</NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="top">
          <label>
            <span className="muted">作業中のプロジェクト </span>
            <select value={currentProject?.id ?? ''} onChange={(e) => setCurrentProject(e.target.value)} aria-label="作業中のプロジェクト">
              {!currentProject && <option value="">未選択</option>}
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.id} {p.name}</option>)}
            </select>
          </label>
          {currentProject && <span className="muted">rootPath: {currentProject.rootPath}</span>}
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="contexts" element={<ContextList />} />
        <Route path="contexts/new" element={<ContextRegister />} />
        <Route path="contexts/:id" element={<ContextDetail />} />
        <Route path="documents" element={<ArtifactList mode="document" />} />
        <Route path="documents/:id" element={<ArtifactDetail mode="document" />} />
        <Route path="convert" element={<Convert />} />
        <Route path="tasks" element={<WorkItemList kind="task" />} />
        <Route path="tasks/:id" element={<WorkItemDetail kind="task" />} />
        <Route path="issues" element={<WorkItemList kind="issue" />} />
        <Route path="issues/:id" element={<WorkItemDetail kind="issue" />} />
        <Route path="qa" element={<WorkItemList kind="qa" />} />
        <Route path="qa/:id" element={<WorkItemDetail kind="qa" />} />
        <Route path="prompts" element={<Prompts />} />
        <Route path="executions" element={<Executions />} />
        <Route path="ai-artifacts" element={<ArtifactList mode="ai" />} />
        <Route path="ai-artifacts/:id" element={<ArtifactDetail mode="ai" />} />
        <Route path="traceability" element={<TraceList />} />
        <Route path="traceability/matrix" element={<TraceMatrix />} />
        <Route path="git/repositories" element={<Repositories />} />
        <Route path="git/branches" element={<Branches />} />
        <Route path="git/pull-requests" element={<PullRequests />} />
        <Route path="git/releases" element={<Releases />} />
        <Route path="*" element={<Empty title="ページが見つかりません" action={<Link className="btn primary" to="/">ダッシュボードへ</Link>} />} />
      </Route>
    </Routes>
  );
}
