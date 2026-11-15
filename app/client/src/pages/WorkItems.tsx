import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  Badge, DetailGrid, Empty, FilterSelect, FormModal, ImpactPanel, PageHeader, RelatedLinks, RequireProject,
  SearchBox, Section, Table, statusTone, useToast, type FieldDef,
} from '../ui';
import { PRIORITIES, WORKITEM_TYPES, labelOf } from '../meta';
import { formatDate } from '../util';
import type { Priority, WorkItem, WorkItemStatus, WorkItemType } from '../types';

export type Kind = 'task' | 'issue' | 'qa';
interface Cfg {
  title: string; scr: string; detailScr: string; base: string; noun: string;
  types: WorkItemType[]; statuses: WorkItemStatus[]; labels: Partial<Record<WorkItemStatus, string>>;
}
const CFG: Record<Kind, Cfg> = {
  task: { title: 'タスク一覧', scr: 'SCR-021', detailScr: 'SCR-022', base: '/tasks', noun: 'タスク', types: ['TASK', 'REVIEW', 'FIX'], statuses: ['TODO', 'DOING', 'DONE'], labels: {} },
  issue: { title: '課題一覧', scr: 'SCR-017', detailScr: 'SCR-018', base: '/issues', noun: '課題', types: ['BUG'], statuses: ['OPEN', 'DOING', 'CLOSED'], labels: { DOING: 'IN_PROGRESS', CLOSED: 'CLOSE' } },
  qa: { title: 'QA一覧', scr: 'SCR-019', detailScr: 'SCR-020', base: '/qa', noun: 'QA', types: ['QA'], statuses: ['OPEN', 'DONE', 'CLOSED'], labels: { OPEN: '未回答', DONE: '回答確定', CLOSED: 'クローズ' } },
};
const statusLabel = (c: Cfg, s: WorkItemStatus) => c.labels[s] ?? s;
const pathOf = (w: WorkItem) => (w.type === 'BUG' ? `/issues/${w.id}` : w.type === 'QA' ? `/qa/${w.id}` : `/tasks/${w.id}`);

function useFields(c: Cfg, selfId?: string): FieldDef[] {
  const { scoped } = useStore();
  const f: FieldDef[] = [];
  if (c.types.length > 1) f.push({ name: 'type', label: '種別', kind: 'select', options: WORKITEM_TYPES.filter((t) => c.types.includes(t.value as WorkItemType)), required: true });
  f.push(
    { name: 'title', label: c.noun === 'QA' ? '質問' : 'タイトル', kind: 'text', required: true },
    { name: 'description', label: c.noun === 'QA' ? '質問の詳細' : '内容', kind: 'textarea', rows: 5 },
    { name: 'status', label: '状態', kind: 'select', options: c.statuses.map((s) => ({ value: s, label: statusLabel(c, s) })), required: true },
    { name: 'priority', label: '優先度', kind: 'select', options: PRIORITIES, required: true },
    { name: 'assignee', label: '担当者', kind: 'text' },
    { name: 'parentId', label: '親(WBS上の上位項目)', kind: 'select', options: scoped.workItems.filter((w) => w.id !== selfId && w.type !== 'QA').map((w) => ({ value: w.id, label: `${w.id} ${w.title}` })) },
  );
  return f;
}

function ListBody({ kind }: { kind: Kind }) {
  const c = CFG[kind];
  const { scoped, currentProject, add } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const fields = useFields(c);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [prio, setPrio] = useState('');
  const [creating, setCreating] = useState(false);
  const rows = scoped.workItems
    .filter((w) => c.types.includes(w.type))
    .filter((w) => (!status || w.status === status) && (!type || w.type === type) && (!prio || w.priority === prio) && `${w.id}${w.title}${w.description}${w.assignee}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title={c.title} scr={c.scr} actions={<button className="btn primary" onClick={() => setCreating(true)}>{c.noun}を登録</button>} />
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="タイトル・内容・担当者で検索" />
        <FilterSelect value={status} onChange={setStatus} options={c.statuses.map((s) => ({ value: s, label: statusLabel(c, s) }))} all="すべての状態" label="状態" />
        {c.types.length > 1 && <FilterSelect value={type} onChange={setType} options={WORKITEM_TYPES.filter((t) => c.types.includes(t.value as WorkItemType))} all="すべての種別" label="種別" />}
        <FilterSelect value={prio} onChange={setPrio} options={PRIORITIES} all="すべての優先度" label="優先度" />
      </div>
      <Table
        rows={rows}
        onRowClick={(w) => nav(`${c.base}/${w.id}`)}
        empty={<Empty title={`${c.noun}がありません`} hint={`「${c.noun}を登録」から追加してください。`} />}
        columns={[
          { header: 'ID', render: (w) => <span className="id">{w.id}</span> },
          { header: 'タイトル', render: (w) => <>{w.parentId && <span className="muted">└ </span>}{w.title}</> },
          ...(c.types.length > 1 ? [{ header: '種別', render: (w: WorkItem) => <Badge>{labelOf(WORKITEM_TYPES, w.type)}</Badge> }] : []),
          { header: '状態', render: (w) => <Badge tone={statusTone(w.status)}>{statusLabel(c, w.status)}</Badge> },
          { header: '優先度', render: (w) => <Badge tone={statusTone(w.priority)}>{labelOf(PRIORITIES, w.priority)}</Badge> },
          { header: '担当', render: (w) => w.assignee },
          { header: '更新日時', render: (w) => formatDate(w.updatedAt) },
        ]}
      />
      {creating && (
        <FormModal
          wide title={`${c.noun}登録`} fields={fields} submitLabel="登録"
          initial={{ type: c.types[0], status: c.statuses[0], priority: 'MEDIUM' }}
          onClose={() => setCreating(false)}
          onSubmit={(v) => {
            const w = add('workItems', {
              projectId: currentProject!.id, type: (v.type as WorkItemType) || c.types[0], title: v.title as string, description: v.description as string,
              status: v.status as WorkItemStatus, priority: v.priority as Priority, assignee: v.assignee as string, parentId: v.parentId as string, answer: '', isKnowledge: false,
            });
            setCreating(false);
            toast(`${c.noun}を登録しました`);
            nav(`${c.base}/${w.id}`);
          }}
        />
      )}
    </>
  );
}
export function WorkItemList({ kind }: { kind: Kind }) {
  return <RequireProject><ListBody kind={kind} /></RequireProject>;
}

export function WorkItemDetail({ kind }: { kind: Kind }) {
  const c = CFG[kind];
  const { id } = useParams();
  const { scoped, add, update, remove } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const fields = useFields(c, id);
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const w = scoped.workItems.find((x) => x.id === id);
  if (!w) return <Empty title={`${c.noun}が見つかりません`} action={<Link className="btn" to={c.base}>一覧へ戻る</Link>} />;

  const children = scoped.workItems.filter((x) => x.parentId === w.id);
  const exes = scoped.executions.filter((e) => e.workItemId === w.id);
  const arts = scoped.artifacts.filter((a) => a.workItemId === w.id);
  const parent = scoped.workItems.find((x) => x.id === w.parentId);
  const setStatus = (s: WorkItemStatus) => { update('workItems', w.id, { status: s }); toast(`状態を「${statusLabel(c, s)}」にしました`); };
  const draft = answer ?? w.answer;

  return (
    <>
      <PageHeader
        title={w.title} scr={c.detailScr}
        actions={<>
          {kind !== 'qa' ? <Link className="btn" to={`/prompts?workItemId=${w.id}`}>AIプロンプトを生成</Link> : <Link className="btn" to={`/prompts?workItemId=${w.id}`}>AI回答を生成</Link>}
          <button className="btn" onClick={() => setEditing(true)}>編集</button>
          <button className="btn danger" onClick={() => { if (confirm(`この${c.noun}を削除します。よろしいですか?`)) { remove('workItems', w.id); toast('削除しました'); nav(c.base); } }}>削除</button>
        </>}
      />
      <div className="toolbar" role="group" aria-label="状態">
        <span className="muted">状態</span>
        {c.statuses.map((s) => <button key={s} className={`btn ${w.status === s ? 'on' : ''}`} onClick={() => setStatus(s)}>{statusLabel(c, s)}</button>)}
      </div>
      <DetailGrid items={[
        ['ID', w.id], ['種別', labelOf(WORKITEM_TYPES, w.type)], ['優先度', labelOf(PRIORITIES, w.priority)], ['担当者', w.assignee],
        ['親', parent ? <Link to={pathOf(parent)}>{parent.id} {parent.title}</Link> : ''], ['更新日時', formatDate(w.updatedAt)],
      ]} />
      <Section title={kind === 'qa' ? '質問' : '内容'}><pre className="doc">{w.description || '(内容なし)'}</pre></Section>

      {kind === 'qa' && (
        <Section title="回答">
          <textarea rows={6} aria-label="回答" value={draft} onChange={(e) => setAnswer(e.target.value)} placeholder="AIの回答を貼り付けるか、直接入力します" />
          <div className="toolbar" style={{ marginTop: 8 }}>
            <button className="btn" disabled={answer === null} onClick={() => { update('workItems', w.id, { answer: draft }); setAnswer(null); toast('回答を保存しました'); }}>回答を保存</button>
            <button className="btn primary" disabled={!draft.trim()} onClick={() => { update('workItems', w.id, { answer: draft, status: 'DONE' }); setAnswer(null); toast('回答を確定しました'); }}>回答を確定</button>
            <label className="check">
              <input type="checkbox" checked={w.isKnowledge} disabled={w.status !== 'DONE'} onChange={(e) => update('workItems', w.id, { isKnowledge: e.target.checked })} />
              ナレッジ(FAQ)として登録{w.status !== 'DONE' && <span className="muted">(回答確定後に選べます)</span>}
            </label>
          </div>
        </Section>
      )}

      {kind === 'issue' && (
        <>
          <Section title="対応" actions={
            <button className="btn" onClick={() => {
              const t = add('workItems', { projectId: w.projectId, type: 'FIX', title: `対応: ${w.title}`, description: `課題 ${w.id} の対応タスク。`, status: 'TODO', priority: w.priority, assignee: w.assignee, parentId: w.id, answer: '', isKnowledge: false });
              add('traces', { projectId: w.projectId, sourceType: 'WorkItem', sourceId: t.id, targetType: 'WorkItem', targetId: w.id, relationType: 'FIXES' });
              toast('対応タスクを作成しました');
            }}>対応タスクを生成</button>
          }>
            {children.length === 0 ? <p className="muted">対応タスクはまだありません。</p> : (
              <ul className="plain">{children.map((x) => <li key={x.id}><Badge tone={statusTone(x.status)}>{x.status}</Badge> <Link to={pathOf(x)}><span className="id">{x.id}</span> {x.title}</Link></li>)}</ul>
            )}
          </Section>
          <ImpactPanel id={w.id} />
        </>
      )}

      {kind === 'task' && (
        <>
          <Section title="子タスク">
            {children.length === 0 ? <p className="muted">子タスクはありません。</p> : (
              <ul className="plain">{children.map((x) => <li key={x.id}><Badge tone={statusTone(x.status)}>{x.status}</Badge> <Link to={pathOf(x)}><span className="id">{x.id}</span> {x.title}</Link></li>)}</ul>
            )}
          </Section>
          <Section title="AI実行">
            {exes.length === 0 ? <p className="muted">このタスクのAI実行はまだありません。</p> : (
              <ul className="plain">{exes.map((e) => <li key={e.id}><Link to="/executions"><span className="id">{e.id}</span> {formatDate(e.executedAt)}</Link></li>)}</ul>
            )}
          </Section>
          <Section title="成果物">
            {arts.length === 0 ? <p className="muted">このタスクの成果物はまだありません。</p> : (
              <ul className="plain">{arts.map((a) => <li key={a.id}><Link to={`${a.origin === 'AI' ? '/ai-artifacts' : '/documents'}/${a.id}`}><span className="id">{a.id}</span> {a.title}</Link></li>)}</ul>
            )}
          </Section>
        </>
      )}
      <RelatedLinks id={w.id} />

      {editing && (
        <FormModal
          wide title={`${c.noun}編集`} fields={fields}
          initial={{ type: w.type, title: w.title, description: w.description, status: w.status, priority: w.priority, assignee: w.assignee, parentId: w.parentId }}
          onClose={() => setEditing(false)}
          onSubmit={(v) => {
            update('workItems', w.id, {
              ...(v.type ? { type: v.type as WorkItemType } : {}), title: v.title as string, description: v.description as string,
              status: v.status as WorkItemStatus, priority: v.priority as Priority, assignee: v.assignee as string, parentId: v.parentId as string,
            });
            setEditing(false);
            toast('更新しました');
          }}
        />
      )}
    </>
  );
}
