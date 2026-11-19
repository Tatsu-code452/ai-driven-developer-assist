import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { http } from '../api';
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
          onSubmit={async (v) => {
            const p = await add('projects', { name: v.name as string, description: v.description as string, status: v.status as ProjectStatus, rootPath: v.rootPath as string });
            if (!p) return;
            await addDefaultPrompts(p.id);
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
  // 他の案件のデータは読み込んでいないため、件数はサーバーのインデックスから取得する
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    let alive = true;
    setSummary(null);
    http<{ summary: Record<string, number> }>('GET', `/api/projects/${encodeURIComponent(id ?? '')}/stats`)
      .then((r) => { if (alive) setSummary(r.summary); })
      .catch(() => { if (alive) setSummary(null); });
    return () => { alive = false; };
  }, [id]);
  const p = data.projects.find((x) => x.id === id);
  if (!p) return <Empty title="プロジェクトが見つかりません" action={<Link className="btn" to="/projects">一覧へ戻る</Link>} />;

  const stats: [string, number | undefined, string][] = [
    ['コンテキスト', summary?.contexts, '/contexts'],
    ['ドキュメント', summary?.documents, '/documents'],
    ['タスク', summary?.tasks, '/tasks'],
    ['課題', summary?.issues, '/issues'],
    ['QA', summary?.qa, '/qa'],
  ];
  return (
    <>
      <PageHeader
        title={p.name} scr="SCR-003"
        actions={<>
          <button className="btn" onClick={() => setEditing(true)}>編集</button>
          <button className="btn danger" onClick={async () => { if (confirm(`「${p.name}」と配下のデータをすべて削除します。よろしいですか?`) && (await remove('projects', p.id))) { toast('削除しました'); nav('/projects'); } }}>削除</button>
        </>}
      />
      <DetailGrid items={[
        ['ID', p.id], ['状態', labelOf(PROJECT_STATUS, p.status)], ['管理データパス(rootPath)', p.rootPath],
        ['作成日時', formatDate(p.createdAt)], ['更新日時', formatDate(p.updatedAt)], ['説明', p.description],
      ]} />
      <Section title="管理データ状況">
        <div className="stats">
          {stats.map(([label, n, to]) => (
            <Link key={label} to={to} className="stat" onClick={() => setCurrentProject(p.id)}><b>{n ?? '–'}</b>{label}</Link>
          ))}
        </div>
      </Section>
      {editing && (
        <FormModal
          title="プロジェクト編集" fields={FIELDS} initial={{ name: p.name, description: p.description, status: p.status, rootPath: p.rootPath }}
          onClose={() => setEditing(false)}
          onSubmit={async (v) => { if (!(await update('projects', p.id, { name: v.name as string, description: v.description as string, status: v.status as ProjectStatus, rootPath: v.rootPath as string }))) return; setEditing(false); toast('更新しました'); }}
        />
      )}
    </>
  );
}
