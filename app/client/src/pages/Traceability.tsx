import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import {
  Badge, Empty, FilterSelect, FormModal, ImpactPanel, Modal, NodeLink, PageHeader, RequireProject, RowActions,
  SearchBox, Section, Table, useToast,
} from '../ui';
import { RELATION_TYPES, labelOf } from '../meta';
import { allNodes, nodeInfo, reachable } from '../util';
import type { RelationType } from '../types';

function ListBody() {
  const { scoped, currentProject, add, remove } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [rel, setRel] = useState('');
  const [creating, setCreating] = useState(false);
  const [impactId, setImpactId] = useState('');
  const nodes = allNodes(scoped);
  const options = nodes.map((n) => ({ value: n.id, label: `${n.id} [${n.kind}] ${n.label}` }));
  const rows = scoped.traces.filter((t) => (!rel || t.relationType === rel) && `${t.sourceId}${t.targetId}${nodeInfo(scoped, t.sourceId).label}${nodeInfo(scoped, t.targetId).label}`.toLowerCase().includes(q.toLowerCase()));
  // F-012-004: 関連が1件もない項目(コンテキスト・タスク・成果物)
  const linked = new Set(scoped.traces.flatMap((t) => [t.sourceId, t.targetId]));
  const orphans = nodes.filter((n) => ['Context', 'WorkItem', 'Artifact'].includes(n.kind) && !linked.has(n.id));

  return (
    <>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="ID・名称で検索" />
        <FilterSelect value={rel} onChange={setRel} options={RELATION_TYPES} all="すべての関連種別" label="関連種別" />
        <Link className="btn" to="/traceability/matrix">マトリクスを見る</Link>
      </div>
      <Table
        rows={rows}
        empty={<Empty title="関連付けがありません" hint="「関連付けを登録」から、要件・タスク・成果物などをつなげてください。" />}
        columns={[
          { header: 'ID', render: (t) => <span className="id">{t.id}</span> },
          { header: '関連元', render: (t) => <NodeLink id={t.sourceId} /> },
          { header: '関連', render: (t) => <Badge>{labelOf(RELATION_TYPES, t.relationType)}</Badge> },
          { header: '関連先', render: (t) => <NodeLink id={t.targetId} /> },
          { header: '', render: (t) => (
            <RowActions>
              <button className="btn" onClick={() => setImpactId(t.sourceId)}>影響分析</button>
              <button className="btn danger" onClick={async () => { if (await remove('traces', t.id)) toast('関連付けを削除しました'); }}>削除</button>
            </RowActions>
          ) },
        ]}
      />
      <Section title={`関連が未登録の項目(${orphans.length}件)`}>
        {orphans.length === 0 ? <p className="muted">すべての項目に関連付けがあります。</p> : (
          <ul className="plain">{orphans.map((n) => <li key={n.id}><Badge tone="warn">{n.kind}</Badge> <NodeLink id={n.id} /></li>)}</ul>
        )}
      </Section>

      <div style={{ marginTop: 16 }}><button className="btn primary" onClick={() => setCreating(true)}>関連付けを登録</button></div>
      {creating && (
        <FormModal
          title="関連付け登録" submitLabel="登録" initial={{ relationType: 'INPUT' }}
          fields={[
            { name: 'sourceId', label: '関連元', kind: 'select', options, required: true },
            { name: 'relationType', label: '関連種別', kind: 'select', options: RELATION_TYPES, required: true, hint: '関連元から見た関係です(例: 関連元のタスクが関連先の成果物を OUTPUT する)。' },
            { name: 'targetId', label: '関連先', kind: 'select', options, required: true },
          ]}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            if (v.sourceId === v.targetId) return toast('関連元と関連先に同じ項目は選べません', 'bad');
            if (scoped.traces.some((t) => t.sourceId === v.sourceId && t.targetId === v.targetId && t.relationType === v.relationType)) return toast('同じ関連付けが登録済みです', 'bad');
            const created = await add('traces', {
              projectId: currentProject!.id, sourceType: nodeInfo(scoped, v.sourceId as string).kind, sourceId: v.sourceId as string,
              targetType: nodeInfo(scoped, v.targetId as string).kind, targetId: v.targetId as string, relationType: v.relationType as RelationType,
            });
            if (!created) return;
            setCreating(false);
            toast('関連付けを登録しました');
          }}
        />
      )}
      {impactId && (
        <Modal title={`影響分析: ${impactId}`} onClose={() => setImpactId('')}>
          <ImpactPanel id={impactId} />
        </Modal>
      )}
    </>
  );
}
export function TraceList() {
  return (
    <>
      <PageHeader title="トレーサビリティ一覧" scr="SCR-015" />
      <RequireProject><ListBody /></RequireProject>
    </>
  );
}

// 要件 → タスク → 設計 → ソース → テスト → (課題 / QA) の網羅性
const COLS = [
  { key: 'TASK', label: 'タスク', required: true },
  { key: 'DESIGN', label: '設計', required: true },
  { key: 'SOURCE', label: 'ソース', required: true },
  { key: 'TEST', label: 'テスト', required: true },
  { key: 'BUG', label: '課題', required: false },
  { key: 'QA', label: 'QA', required: false },
];

function MatrixBody() {
  const { scoped } = useStore();
  let reqs = scoped.contexts.filter((c) => c.type === 'REQUIREMENT');
  const fallback = reqs.length === 0 && scoped.contexts.length > 0;
  if (fallback) reqs = scoped.contexts;
  if (reqs.length === 0) return <Empty title="要件(コンテキスト)がありません" hint="分類が「要件」のコンテキストを登録すると、行として表示されます。" action={<Link className="btn primary" to="/contexts/new">コンテキストを登録</Link>} />;

  const rows = reqs.map((c) => {
    const found = [...reachable(scoped.traces, c.id, 6).keys()].map((id) => nodeInfo(scoped, id));
    return { c, cells: COLS.map((col) => found.filter((n) => n.category === col.key)) };
  });
  const required = rows.flatMap((r) => r.cells.filter((_, i) => COLS[i].required));
  const filled = required.filter((x) => x.length > 0).length;
  const missing = required.length - filled;
  const pct = required.length ? Math.round((filled / required.length) * 100) : 0;

  return (
    <>
      {fallback && <p className="muted">分類が「要件」のコンテキストがないため、すべてのコンテキストを表示しています。</p>}
      <p>網羅率 <b>{pct}%</b>(欠落 {missing} 件)。タスク・設計・ソース・テストが関連付けられていない箇所は赤で表示します。</p>
      <div className="table-wrap">
        <table className="table matrix">
          <thead><tr><th>要件</th>{COLS.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rows.map(({ c, cells }) => (
              <tr key={c.id}>
                <td><Link to={`/contexts/${c.id}`}><span className="id">{c.id}</span> {c.title}</Link></td>
                {cells.map((items, i) => (
                  <td key={COLS[i].key} className={items.length ? 'cell-ok' : COLS[i].required ? 'cell-missing' : 'cell-opt'} title={items.map((n) => `${n.id} ${n.label}`).join('\n')}>
                    {items.length ? `✓ ${items.length}` : COLS[i].required ? '欠落' : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
export function TraceMatrix() {
  return (
    <>
      <PageHeader title="トレーサビリティマトリクス" scr="SCR-016" />
      <RequireProject><MatrixBody /></RequireProject>
    </>
  );
}
