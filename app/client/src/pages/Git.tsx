import { useState } from 'react';
import { useStore } from '../store';
import {
  Badge, Empty, FilterSelect, FormModal, Modal, PageHeader, RequireProject, RowActions, Section, Table, statusTone, useToast, type FieldDef,
} from '../ui';
import { PR_STATUS, labelOf } from '../meta';
import { formatDate, errMsg } from '../util';
import { gitAction } from '../api';
import type { Branch, PullRequest, PullRequestStatus, Repository } from '../types';

function useRepoOptions() {
  const { scoped } = useStore();
  return scoped.repositories.map((r) => ({ value: r.id, label: `${r.id} ${r.url}` }));
}
const NoRepo = () => <Empty title="リポジトリが登録されていません" hint="先に「リポジトリ」画面で登録してください。" />;

/* ---------- SCR-040 リポジトリ管理 ---------- */
const REPO_FIELDS: FieldDef[] = [
  { name: 'url', label: 'リポジトリURL', kind: 'text', required: true, placeholder: 'https://github.com/owner/repo' },
  { name: 'defaultBranch', label: '既定ブランチ', kind: 'text', required: true },
  { name: 'worktreeRoot', label: 'Worktreeルート', kind: 'text', placeholder: '../worktrees' },
];
function RepoBody() {
  const { scoped, currentProject, add, update, remove } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<Repository | 'new' | null>(null);
  const [busy, setBusy] = useState('');
  const run = async (action: 'fetch' | 'pull', r: Repository) => {
    setBusy(r.id + action);
    try { toast(await gitAction(action, r)); } catch (e) { toast(errMsg(e), 'bad'); } finally { setBusy(''); }
  };
  return (
    <>
      <div className="toolbar"><button className="btn primary" onClick={() => setEditing('new')}>リポジトリを登録</button></div>
      <Table
        rows={scoped.repositories}
        empty={<Empty title="リポジトリが登録されていません" hint="GitHubのURLを登録すると、ブランチやPull Requestを管理できます。" />}
        columns={[
          { header: 'ID', render: (r) => <span className="id">{r.id}</span> },
          { header: 'URL', render: (r) => r.url },
          { header: '現在のブランチ', render: (r) => <Badge tone="info">{r.currentBranch}</Badge> },
          { header: '既定', render: (r) => r.defaultBranch },
          { header: 'Worktreeルート', render: (r) => r.worktreeRoot },
          { header: '', render: (r) => (
            <RowActions>
              <button className="btn" disabled={busy !== ''} onClick={() => run('fetch', r)}>Fetch</button>
              <button className="btn" disabled={busy !== ''} onClick={() => run('pull', r)}>Pull</button>
              <button className="btn" onClick={() => setEditing(r)}>編集</button>
              <button className="btn danger" onClick={async () => { if (confirm('このリポジトリと、紐づくブランチ・PR・リリースの記録を削除します。よろしいですか?') && (await remove('repositories', r.id))) toast('削除しました'); }}>削除</button>
            </RowActions>
          ) },
        ]}
      />
      <p className="hint">Fetch / Pull はバックエンドAPI(POST /api/git/fetch, /api/git/pull)を呼び出します。</p>
      {editing && (
        <FormModal
          title={editing === 'new' ? 'リポジトリ登録' : 'リポジトリ編集'} fields={REPO_FIELDS}
          initial={editing === 'new' ? { defaultBranch: 'main' } : { url: editing.url, defaultBranch: editing.defaultBranch, worktreeRoot: editing.worktreeRoot }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const body = { url: v.url as string, defaultBranch: v.defaultBranch as string, worktreeRoot: v.worktreeRoot as string };
            const saved = editing === 'new' ? await add('repositories', { ...body, projectId: currentProject!.id, currentBranch: body.defaultBranch }) : await update('repositories', editing.id, body);
            if (!saved) return;
            setEditing(null);
            toast('保存しました');
          }}
        />
      )}
    </>
  );
}
export function Repositories() {
  return (
    <>
      <PageHeader title="リポジトリ管理" scr="SCR-040" />
      <RequireProject><RepoBody /></RequireProject>
    </>
  );
}

/* ---------- SCR-041 ブランチ管理 ---------- */
function BranchBody() {
  const { scoped, currentProject, add, update, remove } = useStore();
  const toast = useToast();
  const repoOptions = useRepoOptions();
  const [repoId, setRepoId] = useState('');
  const [editing, setEditing] = useState<Branch | 'new' | null>(null);
  const fields: FieldDef[] = [
    { name: 'repositoryId', label: 'リポジトリ', kind: 'select', options: repoOptions, required: true },
    { name: 'name', label: 'ブランチ名', kind: 'text', required: true, placeholder: 'feature/xxx' },
    { name: 'baseBranch', label: '作成元ブランチ', kind: 'text', required: true },
    { name: 'worktreePath', label: 'Worktreeパス', kind: 'text', hint: '作業ツリーを分ける場合のパス(任意)' },
  ];
  if (scoped.repositories.length === 0) return <NoRepo />;
  const rows = scoped.branches.filter((b) => !repoId || b.repositoryId === repoId);
  const repoOf = (id: string) => scoped.repositories.find((r) => r.id === id);
  return (
    <>
      <div className="toolbar">
        <FilterSelect value={repoId} onChange={setRepoId} options={repoOptions} all="すべてのリポジトリ" label="リポジトリ" />
        <button className="btn primary" onClick={() => setEditing('new')}>ブランチを作成</button>
      </div>
      <Table
        rows={rows}
        empty={<Empty title="ブランチがありません" />}
        columns={[
          { header: 'ID', render: (b) => <span className="id">{b.id}</span> },
          { header: 'ブランチ', render: (b) => <>{b.name} {repoOf(b.repositoryId)?.currentBranch === b.name && <Badge tone="info">チェックアウト中</Badge>}</> },
          { header: '作成元', render: (b) => b.baseBranch },
          { header: 'Worktree', render: (b) => b.worktreePath },
          { header: 'リポジトリ', render: (b) => repoOf(b.repositoryId)?.url ?? '' },
          { header: '', render: (b) => (
            <RowActions>
              <button className="btn" onClick={async () => { if (await update('repositories', b.repositoryId, { currentBranch: b.name })) toast(`${b.name} をチェックアウト中として記録しました`); }}>切り替え</button>
              <button className="btn" onClick={() => setEditing(b)}>編集</button>
              <button className="btn danger" onClick={async () => { if (await remove('branches', b.id)) toast('削除しました'); }}>削除</button>
            </RowActions>
          ) },
        ]}
      />
      <p className="hint">ここでの作成・切り替えは管理上の記録です。実際のgit操作は各自のリポジトリで実施してください。</p>
      {editing && (
        <FormModal
          title={editing === 'new' ? 'ブランチ作成' : 'ブランチ編集'} fields={fields}
          initial={editing === 'new' ? { repositoryId: repoId || repoOptions[0]?.value, baseBranch: repoOf(repoId || repoOptions[0]?.value)?.defaultBranch ?? 'main' } : { repositoryId: editing.repositoryId, name: editing.name, baseBranch: editing.baseBranch, worktreePath: editing.worktreePath }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const body = { repositoryId: v.repositoryId as string, name: v.name as string, baseBranch: v.baseBranch as string, worktreePath: v.worktreePath as string };
            const saved = editing === 'new' ? await add('branches', { ...body, projectId: currentProject!.id }) : await update('branches', editing.id, body);
            if (!saved) return;
            setEditing(null);
            toast('保存しました');
          }}
        />
      )}
    </>
  );
}
export function Branches() {
  return (
    <>
      <PageHeader title="ブランチ管理" scr="SCR-041" />
      <RequireProject><BranchBody /></RequireProject>
    </>
  );
}

/* ---------- SCR-042 Pull Request管理 ---------- */
function PRBody() {
  const { scoped, currentProject, add, update, remove } = useStore();
  const toast = useToast();
  const repoOptions = useRepoOptions();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const open = scoped.pullRequests.find((p) => p.id === openId);
  const branchOptions = [...new Set(scoped.branches.map((b) => b.name))].map((n) => ({ value: n, label: n }));
  if (scoped.repositories.length === 0) return <NoRepo />;
  const rows = scoped.pullRequests.filter((p) => !status || p.status === status);
  // マージ日時はサーバーが記録する
  const setSt = async (p: PullRequest, s: PullRequestStatus) => { if (await update('pullRequests', p.id, { status: s })) toast(`「${labelOf(PR_STATUS, s)}」にしました`); };

  return (
    <>
      <div className="toolbar">
        <FilterSelect value={status} onChange={setStatus} options={PR_STATUS} all="すべての状態" label="状態" />
        <button className="btn primary" onClick={() => setCreating(true)}>Pull Requestを作成</button>
      </div>
      <Table
        rows={rows}
        onRowClick={(p) => { setOpenId(p.id); setNote(null); }}
        empty={<Empty title="Pull Requestがありません" />}
        columns={[
          { header: 'ID', render: (p) => <span className="id">{p.id}</span> },
          { header: 'タイトル', render: (p) => p.title },
          { header: 'ブランチ', render: (p) => `${p.sourceBranch} → ${p.targetBranch}` },
          { header: '状態', render: (p) => <Badge tone={statusTone(p.status)}>{labelOf(PR_STATUS, p.status)}</Badge> },
          { header: '更新日時', render: (p) => formatDate(p.updatedAt) },
        ]}
      />
      {creating && (
        <FormModal
          wide title="Pull Request作成" submitLabel="作成" initial={{ repositoryId: repoOptions[0]?.value, targetBranch: 'main' }}
          fields={[
            { name: 'repositoryId', label: 'リポジトリ', kind: 'select', options: repoOptions, required: true },
            { name: 'title', label: 'タイトル', kind: 'text', required: true },
            { name: 'sourceBranch', label: 'マージ元ブランチ', kind: 'select', options: branchOptions, required: true, hint: 'ブランチ管理で登録したブランチから選べます。' },
            { name: 'targetBranch', label: 'マージ先ブランチ', kind: 'text', required: true },
            { name: 'description', label: '説明', kind: 'textarea', rows: 5 },
          ]}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            const p = await add('pullRequests', { projectId: currentProject!.id, repositoryId: v.repositoryId as string, title: v.title as string, description: v.description as string, sourceBranch: v.sourceBranch as string, targetBranch: v.targetBranch as string, status: 'OPEN', reviewNote: '', mergedAt: '' });
            if (!p) return;
            setCreating(false);
            toast(`${p.id} を作成しました`);
          }}
        />
      )}
      {open && (
        <Modal wide title={`${open.id} ${open.title}`} onClose={() => setOpenId('')}>
          <p className="muted">{open.sourceBranch} → {open.targetBranch} / {labelOf(PR_STATUS, open.status)}{open.mergedAt && ` / マージ ${formatDate(open.mergedAt)}`}</p>
          {open.description && <pre className="doc">{open.description}</pre>}
          <Section title="レビュー">
            <textarea rows={5} aria-label="レビュー結果" value={note ?? open.reviewNote} onChange={(e) => setNote(e.target.value)} placeholder="レビューコメントを記録します" />
            <div className="toolbar" style={{ marginTop: 8 }}>
              <button className="btn" disabled={note === null} onClick={async () => { if (!(await update('pullRequests', open.id, { reviewNote: note ?? '' }))) return; setNote(null); toast('レビュー結果を保存しました'); }}>レビュー結果を保存</button>
              <button className="btn" disabled={open.status !== 'OPEN'} onClick={() => setSt(open, 'REVIEWING')}>レビュー開始</button>
              <button className="btn primary" disabled={open.status !== 'REVIEWING'} onClick={() => setSt(open, 'MERGED')}>マージ済みにする</button>
              <button className="btn" disabled={open.status === 'MERGED' || open.status === 'CLOSED'} onClick={() => setSt(open, 'CLOSED')}>クローズ</button>
              <button className="btn danger" onClick={async () => { if (!(await remove('pullRequests', open.id))) return; setOpenId(''); toast('削除しました'); }}>削除</button>
            </div>
          </Section>
        </Modal>
      )}
    </>
  );
}
export function PullRequests() {
  return (
    <>
      <PageHeader title="Pull Request管理" scr="SCR-042" />
      <RequireProject><PRBody /></RequireProject>
    </>
  );
}

/* ---------- SCR-043 リリース管理 ---------- */
function ReleaseBody() {
  const { scoped, currentProject, add, update, remove } = useStore();
  const toast = useToast();
  const repoOptions = useRepoOptions();
  const [creating, setCreating] = useState(false);
  if (scoped.repositories.length === 0) return <NoRepo />;
  const waiting = scoped.pullRequests.filter((p) => p.status === 'REVIEWING');
  const merged = scoped.pullRequests.filter((p) => p.status === 'MERGED');
  const repoUrl = (id: string) => scoped.repositories.find((r) => r.id === id)?.url ?? '';
  return (
    <>
      <Section title="マージ待ち(レビュー中のPull Request)">
        <Table
          rows={waiting}
          empty={<p className="muted">マージ待ちのPull Requestはありません。</p>}
          columns={[
            { header: 'ID', render: (p) => <span className="id">{p.id}</span> },
            { header: 'タイトル', render: (p) => p.title },
            { header: 'ブランチ', render: (p) => `${p.sourceBranch} → ${p.targetBranch}` },
            { header: '', render: (p) => <RowActions><button className="btn primary" onClick={async () => { if (await update('pullRequests', p.id, { status: 'MERGED' })) toast(`${p.id} をマージ済みにしました`); }}>マージ</button></RowActions> },
          ]}
        />
      </Section>
      <Section title={`リリース履歴(マージ済みPR ${merged.length}件)`} actions={<button className="btn primary" onClick={() => setCreating(true)}>タグを作成</button>}>
        <Table
          rows={[...scoped.releases].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))}
          empty={<Empty title="リリース履歴がありません" hint="「タグを作成」でリリースを記録します。" />}
          columns={[
            { header: 'タグ', render: (r) => <Badge tone="ok">{r.tag}</Badge> },
            { header: 'リポジトリ', render: (r) => repoUrl(r.repositoryId) },
            { header: 'リリースノート', render: (r) => r.note },
            { header: '日時', render: (r) => formatDate(r.releasedAt) },
            { header: '', render: (r) => <RowActions><button className="btn danger" onClick={async () => { if (await remove('releases', r.id)) toast('削除しました'); }}>削除</button></RowActions> },
          ]}
        />
      </Section>
      {creating && (
        <FormModal
          title="タグ作成" submitLabel="作成" initial={{ repositoryId: repoOptions[0]?.value }}
          fields={[
            { name: 'repositoryId', label: 'リポジトリ', kind: 'select', options: repoOptions, required: true },
            { name: 'tag', label: 'タグ', kind: 'text', required: true, placeholder: 'v1.0.0' },
            { name: 'note', label: 'リリースノート', kind: 'textarea', rows: 6, placeholder: merged.map((p) => `- ${p.title}`).join('\n') },
          ]}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            if (scoped.releases.some((r) => r.repositoryId === v.repositoryId && r.tag === v.tag)) return toast('同じタグが登録済みです', 'bad');
            const rel = await add('releases', { projectId: currentProject!.id, repositoryId: v.repositoryId as string, tag: v.tag as string, note: v.note as string, releasedAt: new Date().toISOString() });
            if (!rel) return;
            setCreating(false);
            toast('リリースを記録しました');
          }}
        />
      )}
    </>
  );
}
export function Releases() {
  return (
    <>
      <PageHeader title="リリース管理" scr="SCR-043" />
      <RequireProject><ReleaseBody /></RequireProject>
    </>
  );
}
