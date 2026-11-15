import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { PageHeader, RequireProject, Section, Table } from '../ui';
import { AI_TYPES, labelOf } from '../meta';
import { formatDate } from '../util';

function Body() {
  const { scoped, currentProject } = useStore();
  const tasks = scoped.workItems.filter((w) => ['TASK', 'REVIEW', 'FIX'].includes(w.type));
  const issues = scoped.workItems.filter((w) => w.type === 'BUG');
  const qas = scoped.workItems.filter((w) => w.type === 'QA');
  const docs = scoped.artifacts.filter((a) => a.origin !== 'AI');
  const aiArts = scoped.artifacts.filter((a) => a.origin === 'AI');
  const done = tasks.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;
  const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const tiles = [
    { label: 'タスク', value: tasks.length, sub: `完了 ${done}`, to: '/tasks' },
    { label: 'ドキュメント', value: docs.length, sub: `AI成果物 ${aiArts.length}`, to: '/documents' },
    { label: '未解決の課題', value: issues.filter((i) => i.status !== 'CLOSED').length, sub: `全 ${issues.length} 件`, to: '/issues' },
    { label: '未回答のQA', value: qas.filter((q) => q.status === 'OPEN').length, sub: `全 ${qas.length} 件`, to: '/qa' },
    { label: 'AI実行', value: scoped.executions.length, sub: `コンテキスト ${scoped.contexts.length}`, to: '/executions' },
  ];
  const statusRows = (['TODO', 'DOING', 'DONE'] as const).map((s) => ({ s, n: tasks.filter((t) => t.status === s).length }));
  const recent = [...scoped.executions].sort((a, b) => b.executedAt.localeCompare(a.executedAt)).slice(0, 5);

  return (
    <>
      <p className="muted">{currentProject?.description}</p>
      <div className="stats">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="stat"><b>{t.value}</b>{t.label}<br /><span>{t.sub}</span></Link>
        ))}
      </div>

      <Section title={`タスク進捗 ${rate}%`}>
        {tasks.length === 0 ? (
          <p className="muted">タスクがありません。<Link to="/tasks">タスク一覧</Link>から登録してください。</p>
        ) : (
          statusRows.map(({ s, n }) => (
            <div className="bar-row" key={s}>
              <span>{s}</span>
              <div className="bar"><span style={{ width: `${(n / tasks.length) * 100}%` }} /></div>
              <span>{n}</span>
            </div>
          ))
        )}
      </Section>

      <Section title="AI利用状況">
        {scoped.executions.length === 0 ? (
          <p className="muted">AI実行履歴がありません。<Link to="/prompts">プロンプト生成</Link>から始められます。</p>
        ) : (
          <>
            <p>{AI_TYPES.map((t) => `${t.label} ${scoped.executions.filter((e) => e.aiType === t.value).length}件`).join('、')}</p>
            <Table
              rows={recent}
              columns={[
                { header: 'ID', render: (e) => <span className="id">{e.id}</span> },
                { header: '実行日時', render: (e) => formatDate(e.executedAt) },
                { header: 'AI', render: (e) => labelOf(AI_TYPES, e.aiType) },
                { header: '対象', render: (e) => e.workItemId || '-' },
              ]}
            />
          </>
        )}
      </Section>
    </>
  );
}

export default function Dashboard() {
  return (
    <>
      <PageHeader title="ダッシュボード" scr="SCR-001" />
      <RequireProject><Body /></RequireProject>
    </>
  );
}
