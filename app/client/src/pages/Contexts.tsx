import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  Badge, DetailGrid, Empty, FilterSelect, FormFields, FormModal, PageHeader, RelatedLinks, RequireProject,
  SearchBox, Section, Table, defaultValues, firstMissing, useToast, type FieldDef, type Values,
} from '../ui';
import { CONTEXT_TYPES, labelOf } from '../meta';
import { formatDate, splitTags } from '../util';
import type { ContextType } from '../types';

function useFields(): FieldDef[] {
  const { scoped } = useStore();
  return [
    { name: 'title', label: '名称', kind: 'text', required: true },
    { name: 'type', label: '分類', kind: 'select', options: CONTEXT_TYPES, required: true, hint: '要件・設計・テストなど、AIに渡す情報の種類です。' },
    { name: 'content', label: '本文', kind: 'textarea', rows: 10, required: true },
    { name: 'tags', label: 'タグ', kind: 'text', placeholder: '例: 認証, 画面', hint: 'カンマまたはスペース区切り' },
    { name: 'sourceArtifactIds', label: '元になったドキュメント', kind: 'checks', options: scoped.artifacts.map((a) => ({ value: a.id, label: `${a.id} ${a.title}` })) },
  ];
}

function ListBody() {
  const { scoped } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const rows = scoped.contexts.filter((c) => (!type || c.type === type) && `${c.id}${c.title}${c.content}${c.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="名称・本文・タグで検索" />
        <FilterSelect value={type} onChange={setType} options={CONTEXT_TYPES} all="すべての分類" label="分類" />
      </div>
      <Table
        rows={rows}
        onRowClick={(c) => nav(`/contexts/${c.id}`)}
        empty={<Empty title="コンテキストがありません" hint="ドキュメントから要件を取り込むか、新規に登録してください。" action={<Link className="btn primary" to="/contexts/new">コンテキストを登録</Link>} />}
        columns={[
          { header: 'ID', render: (c) => <span className="id">{c.id}</span> },
          { header: '名称', render: (c) => c.title },
          { header: '分類', render: (c) => <Badge>{labelOf(CONTEXT_TYPES, c.type)}</Badge> },
          { header: 'タグ', render: (c) => c.tags.join(', ') },
          { header: '更新日時', render: (c) => formatDate(c.updatedAt) },
        ]}
      />
    </>
  );
}

export function ContextList() {
  return (
    <>
      <PageHeader title="コンテキスト一覧" scr="SCR-004" actions={<Link className="btn primary" to="/contexts/new">コンテキストを登録</Link>} />
      <RequireProject><ListBody /></RequireProject>
    </>
  );
}

function RegisterBody() {
  const { scoped, currentProject, add } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const fields = useFields();
  const [values, setValues] = useState<Values>(() => defaultValues(fields, { type: 'REQUIREMENT' }));
  const [error, setError] = useState('');
  const docs = scoped.artifacts;

  const importDoc = (id: string) => {
    const d = docs.find((x) => x.id === id);
    if (!d) return;
    setValues((v) => ({ ...v, title: v.title || d.title, content: d.content, sourceArtifactIds: [d.id] }));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const miss = firstMissing(fields, values);
    if (miss) return setError(`「${miss}」を入力してください`);
    const c = add('contexts', {
      projectId: currentProject!.id, title: values.title as string, type: values.type as ContextType, content: values.content as string,
      sourceArtifactIds: values.sourceArtifactIds as string[], tags: splitTags(values.tags as string),
    });
    toast('コンテキストを登録しました');
    nav(`/contexts/${c.id}`);
  };
  return (
    <form onSubmit={submit} style={{ maxWidth: 760 }}>
      <div className="field">
        <label htmlFor="import">ドキュメントから取り込む</label>
        <select id="import" defaultValue="" onChange={(e) => importDoc(e.target.value)}>
          <option value="">取り込まない(手入力)</option>
          {docs.map((d) => <option key={d.id} value={d.id}>{d.id} {d.title}</option>)}
        </select>
        <p className="hint">選ぶと名称・本文・元ドキュメントが入力されます。</p>
      </div>
      <FormFields fields={fields} values={values} onChange={(n, v) => setValues((p) => ({ ...p, [n]: v }))} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <Link className="btn" to="/contexts">キャンセル</Link>
        <button type="submit" className="btn primary">登録</button>
      </div>
    </form>
  );
}

export function ContextRegister() {
  return (
    <>
      <PageHeader title="コンテキスト登録" scr="SCR-006" />
      <RequireProject><RegisterBody /></RequireProject>
    </>
  );
}

export function ContextDetail() {
  const { id } = useParams();
  const { scoped, add, update, remove } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const fields = useFields();
  const [editing, setEditing] = useState(false);
  const [taskTitle, setTaskTitle] = useState<string | null>(null);
  const c = scoped.contexts.find((x) => x.id === id);
  if (!c) return <Empty title="コンテキストが見つかりません" action={<Link className="btn" to="/contexts">一覧へ戻る</Link>} />;

  // 関連タスク = トレーサビリティで直接つながるもの + このコンテキストを使ったAI実行の対象
  const linked = new Set<string>(scoped.traces.flatMap((t) => (t.sourceId === c.id ? [t.targetId] : t.targetId === c.id ? [t.sourceId] : [])));
  scoped.executions.filter((e) => e.contextIds.includes(c.id) && e.workItemId).forEach((e) => linked.add(e.workItemId));
  const tasks = scoped.workItems.filter((w) => linked.has(w.id));
  const docIds = new Set([...c.sourceArtifactIds, ...[...linked].filter((x) => x.startsWith('ART-'))]);
  const docs = scoped.artifacts.filter((a) => docIds.has(a.id));

  return (
    <>
      <PageHeader
        title={c.title} scr="SCR-005"
        actions={<>
          <button className="btn" onClick={() => setTaskTitle(`${c.title} の分析`)}>タスクを作成</button>
          <Link className="btn" to={`/prompts?contextId=${c.id}`}>プロンプトを生成</Link>
          <button className="btn" onClick={() => setEditing(true)}>編集</button>
          <button className="btn danger" onClick={() => { if (confirm('このコンテキストを削除します。よろしいですか?')) { remove('contexts', c.id); toast('削除しました'); nav('/contexts'); } }}>削除</button>
        </>}
      />
      <DetailGrid items={[['ID', c.id], ['分類', labelOf(CONTEXT_TYPES, c.type)], ['タグ', c.tags.join(', ')], ['更新日時', formatDate(c.updatedAt)]]} />
      <Section title="本文"><pre className="doc">{c.content}</pre></Section>
      <Section title="関連タスク">
        {tasks.length === 0 ? <p className="muted">関連タスクはありません。「タスクを作成」から登録できます。</p> : (
          <ul className="plain">{tasks.map((t) => <li key={t.id}><Link to={t.type === 'BUG' ? `/issues/${t.id}` : t.type === 'QA' ? `/qa/${t.id}` : `/tasks/${t.id}`}><span className="id">{t.id}</span> {t.title}</Link></li>)}</ul>
        )}
      </Section>
      <Section title="関連ドキュメント">
        {docs.length === 0 ? <p className="muted">関連ドキュメントはありません。</p> : (
          <ul className="plain">{docs.map((a) => <li key={a.id}><Link to={`${a.origin === 'AI' ? '/ai-artifacts' : '/documents'}/${a.id}`}><span className="id">{a.id}</span> {a.title}</Link></li>)}</ul>
        )}
      </Section>
      <RelatedLinks id={c.id} />

      {editing && (
        <FormModal
          wide title="コンテキスト編集" fields={fields}
          initial={{ title: c.title, type: c.type, content: c.content, tags: c.tags.join(', '), sourceArtifactIds: c.sourceArtifactIds }}
          onClose={() => setEditing(false)}
          onSubmit={(v) => { update('contexts', c.id, { title: v.title as string, type: v.type as ContextType, content: v.content as string, tags: splitTags(v.tags as string), sourceArtifactIds: v.sourceArtifactIds as string[] }); setEditing(false); toast('更新しました'); }}
        />
      )}
      {taskTitle !== null && (
        <FormModal
          title="コンテキストからタスクを作成" submitLabel="作成" initial={{ title: taskTitle }}
          fields={[{ name: 'title', label: 'タスク名', kind: 'text', required: true }]}
          onClose={() => setTaskTitle(null)}
          onSubmit={(v) => {
            const t = add('workItems', { projectId: c.projectId, type: 'TASK', title: v.title as string, description: `コンテキスト ${c.id} (${c.title}) をもとに実施する。`, status: 'TODO', priority: 'MEDIUM', assignee: '', parentId: '', answer: '', isKnowledge: false });
            add('traces', { projectId: c.projectId, sourceType: 'Context', sourceId: c.id, targetType: 'WorkItem', targetId: t.id, relationType: 'INPUT' });
            setTaskTitle(null);
            toast('タスクを作成し、関連付けました');
          }}
        />
      )}
    </>
  );
}
