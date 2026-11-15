import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Badge, DetailGrid, Empty, FilterSelect, FormModal, PageHeader, RowActions, SearchBox, Section, Table, statusTone, useToast, type FieldDef } from '../ui';
import { PROJECT_STATUS, labelOf } from '../meta';
import { formatDate } from '../util';
import type { ProjectStatus } from '../types';

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'プロジェクト名', kind: 'text', required: true },
  { name: 'description', label: '説明', kind: 'textarea', rows: 3 },
  { name: 'status', label: '状態', kind: 'select', options: PROJECT_STATUS, required: true },
  { name: 'rootPath', label: '管理データパス(rootPath)', kind: 'text', required: true, placeholder: './datas', hint: '成果物・管理データの保管先です。' },
];

export function ProjectList() {
  const { data, currentProject, add, setCurrentProject, addDefaultPrompts } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const rows = data.projects.filter((p) => (!status || p.status === status) && `${p.id}${p.name}${p.description}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="プロジェクト一覧" scr="SCR-002" actions={<button className="btn primary" onClick={() => setCreating(true)}>プロジェクトを登録</button>} />
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="名称・説明で検索" />
        <FilterSelect value={status} onChange={setStatus} options={PROJECT_STATUS} all="すべての状態" label="状態" />
      </div>
      <Table
        rows={rows}
        onRowClick={(p) => nav(`/projects/${p.id}`)}
        empty={<Empty title="プロジェクトがありません" hint="「プロジェクトを登録」から作業対象を追加してください。" />}
        columns={[
          { header: 'ID', render: (p) => <span className="id">{p.id}</span> },
          { header: '名称', render: (p) => <>{p.name} {currentProject?.id === p.id && <Badge tone="ok">選択中</Badge>}</> },
          { header: '状態', render: (p) => <Badge tone={statusTone(p.status)}>{labelOf(PROJECT_STATUS, p.status)}</Badge> },
          { header: 'rootPath', render: (p) => p.rootPath },
          { header: '更新日時', render: (p) => formatDate(p.updatedAt) },
          { header: '', render: (p) => <RowActions><button className="btn" disabled={currentProject?.id === p.id} onClick={() => { setCurrentProject(p.id); toast(`「${p.name}」で作業します`); }}>選択</button></RowActions> },
        ]}
      />
      {creating && (
        <FormModal
          title="プロジェクト登録" fields={FIELDS} initial={{ status: 'PLANNING' }} submitLabel="登録"
          onClose={() => setCreating(false)}
          onSubmit={(v) => {
            const p = add('projects', { name: v.name as string, description: v.description as string, status: v.status as ProjectStatus, rootPath: v.rootPath as string });
            addDefaultPrompts(p.id);
            setCurrentProject(p.id);
            setCreating(false);
            toast('プロジェクトを登録しました');
            nav(`/projects/${p.id}`);
          }}
        />
      )}
    </>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const { data, update, remove, setCurrentProject } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const p = data.projects.find((x) => x.id === id);
  if (!p) return <Empty title="プロジェクトが見つかりません" action={<Link className="btn" to="/projects">一覧へ戻る</Link>} />;

  const mine = <T extends { projectId: string }>(list: T[]) => list.filter((x) => x.projectId === p.id);
  const wi = mine(data.workItems);
  const stats: [string, number, string][] = [
    ['コンテキスト', mine(data.contexts).length, '/contexts'],
    ['ドキュメント', mine(data.artifacts).filter((a) => a.origin !== 'AI').length, '/documents'],
    ['タスク', wi.filter((w) => ['TASK', 'REVIEW', 'FIX'].includes(w.type)).length, '/tasks'],
    ['課題', wi.filter((w) => w.type === 'BUG').length, '/issues'],
    ['QA', wi.filter((w) => w.type === 'QA').length, '/qa'],
  ];
  return (
    <>
      <PageHeader
        title={p.name} scr="SCR-003"
        actions={<>
          <button className="btn" onClick={() => setEditing(true)}>編集</button>
          <button className="btn danger" onClick={() => { if (confirm(`「${p.name}」と配下のデータをすべて削除します。よろしいですか?`)) { remove('projects', p.id); toast('削除しました'); nav('/projects'); } }}>削除</button>
        </>}
      />
      <DetailGrid items={[
        ['ID', p.id], ['状態', labelOf(PROJECT_STATUS, p.status)], ['管理データパス(rootPath)', p.rootPath],
        ['作成日時', formatDate(p.createdAt)], ['更新日時', formatDate(p.updatedAt)], ['説明', p.description],
      ]} />
      <Section title="管理データ状況">
        <div className="stats">
          {stats.map(([label, n, to]) => (
            <Link key={label} to={to} className="stat" onClick={() => setCurrentProject(p.id)}><b>{n}</b>{label}</Link>
          ))}
        </div>
      </Section>
      {editing && (
        <FormModal
          title="プロジェクト編集" fields={FIELDS} initial={{ name: p.name, description: p.description, status: p.status, rootPath: p.rootPath }}
          onClose={() => setEditing(false)}
          onSubmit={(v) => { update('projects', p.id, { name: v.name as string, description: v.description as string, status: v.status as ProjectStatus, rootPath: v.rootPath as string }); setEditing(false); toast('更新しました'); }}
        />
      )}
    </>
  );
}
