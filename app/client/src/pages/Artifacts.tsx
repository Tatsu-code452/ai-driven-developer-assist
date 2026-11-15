import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  Badge, DetailGrid, Empty, FilterSelect, FormModal, PageHeader, RelatedLinks, RequireProject,
  SearchBox, Section, Table, statusTone, useToast, type FieldDef,
} from '../ui';
import { ARTIFACT_STATUS, ARTIFACT_TYPES, labelOf } from '../meta';
import { formatDate } from '../util';
import type { ArtifactStatus, ArtifactType } from '../types';

type Mode = 'document' | 'ai';
const base = (m: Mode) => (m === 'ai' ? '/ai-artifacts' : '/documents');

function useFields(): FieldDef[] {
  const { scoped } = useStore();
  return [
    { name: 'title', label: 'タイトル', kind: 'text', required: true },
    { name: 'artifactType', label: '分類', kind: 'select', options: ARTIFACT_TYPES, required: true },
    { name: 'path', label: '配置パス', kind: 'text', placeholder: 'docs/basic_design/画面一覧.md', hint: 'rootPath からの相対パス' },
    { name: 'workItemId', label: '作成元のタスク', kind: 'select', options: scoped.workItems.filter((w) => w.type !== 'QA').map((w) => ({ value: w.id, label: `${w.id} ${w.title}` })) },
    { name: 'content', label: '内容', kind: 'textarea', rows: 12 },
  ];
}

function ListBody({ mode }: { mode: Mode }) {
  const { scoped, currentProject, add } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const fields = useFields();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const rows = scoped.artifacts
    .filter((a) => (mode === 'ai' ? a.origin === 'AI' : a.origin !== 'AI'))
    .filter((a) => (!type || a.artifactType === type) && (!status || a.status === status) && `${a.id}${a.title}${a.path}${a.content}`.toLowerCase().includes(q.toLowerCase()));
  const noun = mode === 'ai' ? 'AI成果物' : 'ドキュメント';
  return (
    <>
      <PageHeader title={mode === 'ai' ? 'AI成果物管理' : 'ドキュメント一覧'} scr={mode === 'ai' ? 'SCR-032' : 'SCR-007'} actions={<button className="btn primary" onClick={() => setCreating(true)}>{noun}を登録</button>} />
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="タイトル・パス・内容で検索" />
        <FilterSelect value={type} onChange={setType} options={ARTIFACT_TYPES} all="すべての分類" label="分類" />
        <FilterSelect value={status} onChange={setStatus} options={ARTIFACT_STATUS} all="すべての状態" label="状態" />
      </div>
      <Table
        rows={rows}
        onRowClick={(a) => nav(`${base(mode)}/${a.id}`)}
        empty={<Empty title={`${noun}がありません`} hint={mode === 'ai' ? 'AI実行履歴から成果物として登録できます。' : 'テキストを登録するか、ファイル変換で取り込んでください。'} />}
        columns={[
          { header: 'ID', render: (a) => <span className="id">{a.id}</span> },
          { header: 'タイトル', render: (a) => a.title },
          { header: '分類', render: (a) => <Badge>{labelOf(ARTIFACT_TYPES, a.artifactType)}</Badge> },
          { header: '状態', render: (a) => <Badge tone={statusTone(a.status)}>{labelOf(ARTIFACT_STATUS, a.status)}</Badge> },
          { header: '版', render: (a) => `v${a.version}` },
          { header: '更新日時', render: (a) => formatDate(a.updatedAt) },
        ]}
      />
      {creating && (
        <FormModal
          wide title={`${noun}登録`} fields={fields} submitLabel="登録" initial={{ artifactType: 'REQUIREMENT' }}
          onClose={() => setCreating(false)}
          onSubmit={(v) => {
            const a = add('artifacts', {
              projectId: currentProject!.id, workItemId: v.workItemId as string, artifactType: v.artifactType as ArtifactType, title: v.title as string,
              path: v.path as string, content: v.content as string, status: 'DRAFT', approved: false, origin: mode === 'ai' ? 'AI' : 'MANUAL',
              version: 1, versions: [], reviewNote: '',
            });
            setCreating(false);
            toast(`${noun}を登録しました`);
            nav(`${base(mode)}/${a.id}`);
          }}
        />
      )}
    </>
  );
}
export function ArtifactList({ mode }: { mode: Mode }) {
  return <RequireProject><ListBody mode={mode} /></RequireProject>;
}

export function ArtifactDetail({ mode }: { mode: Mode }) {
  const { id } = useParams();
  const { scoped, update, remove } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const fields = useFields();
  const [editing, setEditing] = useState(false);
  const [viewVer, setViewVer] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const a = scoped.artifacts.find((x) => x.id === id);
  if (!a) return <Empty title="成果物が見つかりません" action={<Link className="btn" to={base(mode)}>一覧へ戻る</Link>} />;

  const shown = viewVer === null || viewVer === a.version ? { content: a.content, label: `v${a.version}(最新)` } : (() => {
    const v = a.versions.find((x) => x.version === viewVer);
    return { content: v?.content ?? '', label: `v${viewVer}` };
  })();
  const setStatus = (status: ArtifactStatus, approved = a.approved) => { update('artifacts', a.id, { status, approved }); toast(`状態を「${labelOf(ARTIFACT_STATUS, status)}」にしました`); };

  return (
    <>
      <PageHeader
        title={a.title} scr={mode === 'ai' ? 'SCR-032' : 'SCR-008'}
        actions={<>
          <button className="btn" onClick={() => setEditing(true)}>編集</button>
          <button className="btn danger" onClick={() => { if (confirm('この成果物を削除します。よろしいですか?')) { remove('artifacts', a.id); toast('削除しました'); nav(base(mode)); } }}>削除</button>
        </>}
      />
      <DetailGrid items={[
        ['ID', a.id], ['分類', labelOf(ARTIFACT_TYPES, a.artifactType)], ['状態', <Badge tone={statusTone(a.status)}>{labelOf(ARTIFACT_STATUS, a.status)}</Badge>],
        ['版', `v${a.version}`], ['配置パス', a.path], ['作成元タスク', a.workItemId ? <Link to={`/tasks/${a.workItemId}`}>{a.workItemId}</Link> : ''],
        ['更新日時', formatDate(a.updatedAt)],
      ]} />

      <Section title="レビュー・承認">
        <div className="toolbar">
          <button className="btn" disabled={a.status !== 'DRAFT'} onClick={() => setStatus('REVIEW')}>レビューを依頼</button>
          <button className="btn" disabled={a.status !== 'REVIEW'} onClick={() => setStatus('APPROVED', true)}>承認</button>
          <button className="btn" disabled={a.status !== 'APPROVED'} onClick={() => setStatus('BASELINE')}>ベースライン化</button>
          <button className="btn" disabled={a.status === 'DRAFT'} onClick={() => setStatus('DRAFT', false)}>下書きに戻す</button>
        </div>
        <div className="field">
          <label htmlFor="note">レビュー結果</label>
          <textarea id="note" rows={3} value={note ?? a.reviewNote} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn" disabled={note === null} onClick={() => { update('artifacts', a.id, { reviewNote: note ?? '' }); setNote(null); toast('レビュー結果を保存しました'); }}>レビュー結果を保存</button>
      </Section>

      <Section title={`内容 ${shown.label}`}>
        <pre className="doc">{shown.content || '(内容なし)'}</pre>
      </Section>

      <Section title="版履歴">
        <div className="toolbar">
          {[...a.versions.map((v) => v.version), a.version].sort((x, y) => y - x).map((v) => (
            <button key={v} className={`btn ${(viewVer ?? a.version) === v ? 'on' : ''}`} onClick={() => setViewVer(v)}>v{v}</button>
          ))}
        </div>
        <p className="muted">内容を編集して保存すると、編集前の内容が履歴に残り、版が上がります。</p>
      </Section>
      <RelatedLinks id={a.id} />

      {editing && (
        <FormModal
          wide title="成果物編集" fields={fields}
          initial={{ title: a.title, artifactType: a.artifactType, path: a.path, workItemId: a.workItemId, content: a.content }}
          onClose={() => setEditing(false)}
          onSubmit={(v) => {
            const changed = v.content !== a.content;
            update('artifacts', a.id, {
              title: v.title as string, artifactType: v.artifactType as ArtifactType, path: v.path as string, workItemId: v.workItemId as string, content: v.content as string,
              ...(changed ? { version: a.version + 1, versions: [...a.versions, { version: a.version, content: a.content, savedAt: new Date().toISOString() }], status: 'DRAFT' as const, approved: false } : {}),
            });
            setEditing(false);
            setViewVer(null);
            toast(changed ? `v${a.version + 1} として保存しました(状態は下書きに戻ります)` : '更新しました');
          }}
        />
      )}
    </>
  );
}
