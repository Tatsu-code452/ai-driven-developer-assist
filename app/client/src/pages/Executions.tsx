import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  Badge, Empty, FilterSelect, FormModal, Modal, PageHeader, RequireProject, RowActions, Section, Table, useToast,
} from '../ui';
import { AI_TYPES, ARTIFACT_TYPES, labelOf } from '../meta';
import { formatDate, lineDiff } from '../util';
import type { ArtifactType } from '../types';

function Body() {
  const { scoped, currentProject, add, update, remove } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [aiType, setAiType] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [openId, setOpenId] = useState('');
  const [resp, setResp] = useState('');
  const [registering, setRegistering] = useState(false);

  const rows = [...scoped.executions].filter((e) => !aiType || e.aiType === aiType).sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  const open = scoped.executions.find((e) => e.id === openId);
  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? [p[1], id] : [...p, id]));
  const [ea, eb] = picked.map((id) => scoped.executions.find((e) => e.id === id));
  const diff = ea && eb ? lineDiff(ea.responseText, eb.responseText) : null;

  return (
    <>
      <div className="toolbar">
        <FilterSelect value={aiType} onChange={setAiType} options={AI_TYPES} all="すべてのAI" label="AI種別" />
        <button className="btn" disabled={picked.length !== 2} onClick={() => setComparing(true)}>選択した2件の回答を比較</button>
        <span className="muted">{picked.length}/2 件選択中</span>
      </div>
      <Table
        rows={rows}
        onRowClick={(e) => { setOpenId(e.id); setResp(e.responseText); }}
        empty={<Empty title="AI実行履歴がありません" hint="プロンプト生成から実行内容を保存すると、ここに表示されます。" action={<Link className="btn primary" to="/prompts">プロンプト生成へ</Link>} />}
        columns={[
          { header: '比較', render: (e) => <RowActions><input type="checkbox" aria-label={`${e.id}を比較対象にする`} checked={picked.includes(e.id)} onChange={() => togglePick(e.id)} /></RowActions> },
          { header: 'ID', render: (e) => <span className="id">{e.id}</span> },
          { header: '実行日時', render: (e) => formatDate(e.executedAt) },
          { header: 'AI', render: (e) => <Badge>{labelOf(AI_TYPES, e.aiType)}</Badge> },
          { header: 'タスク', render: (e) => e.workItemId || '-' },
          { header: '回答', render: (e) => (e.responseText ? `${e.responseText.slice(0, 40).replace(/\n/g, ' ')}…` : <span className="muted">未保存</span>) },
        ]}
      />

      {open && !registering && (
        <Modal wide title={`AI実行 ${open.id}`} onClose={() => setOpenId('')}>
          <p className="muted">{formatDate(open.executedAt)} / {labelOf(AI_TYPES, open.aiType)} / タスク {open.workItemId || '未指定'} / コンテキスト {open.contextIds.join(', ') || 'なし'}</p>
          <div className="two-col">
            <div><h2>プロンプト</h2><pre className="doc">{open.requestText}</pre></div>
            <div>
              <h2>回答(編集して保存できます)</h2>
              <textarea rows={16} aria-label="回答" value={resp} onChange={(e) => setResp(e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn danger" onClick={() => { if (confirm('この実行履歴を削除します。よろしいですか?')) { remove('executions', open.id); setOpenId(''); toast('削除しました'); } }}>削除</button>
            <button className="btn" onClick={() => nav(`/prompts?executionId=${open.id}`)}>プロンプトを再利用して再実行</button>
            <button className="btn" disabled={resp === open.responseText} onClick={() => { update('executions', open.id, { responseText: resp }); toast('回答を保存しました'); }}>回答を保存</button>
            <button className="btn primary" disabled={!resp.trim()} onClick={() => setRegistering(true)}>成果物として登録</button>
          </div>
        </Modal>
      )}
      {open && registering && (
        <FormModal
          title="AI成果物として登録" submitLabel="登録" initial={{ title: '', artifactType: 'DESIGN' }}
          fields={[
            { name: 'title', label: 'タイトル', kind: 'text', required: true },
            { name: 'artifactType', label: '分類', kind: 'select', options: ARTIFACT_TYPES, required: true },
          ]}
          onClose={() => setRegistering(false)}
          onSubmit={(v) => {
            const a = add('artifacts', { projectId: currentProject!.id, workItemId: open.workItemId, artifactType: v.artifactType as ArtifactType, title: v.title as string, path: '', content: resp, status: 'DRAFT', approved: false, origin: 'AI', version: 1, versions: [], reviewNote: '' });
            add('traces', { projectId: currentProject!.id, sourceType: 'AIExecution', sourceId: open.id, targetType: 'Artifact', targetId: a.id, relationType: 'OUTPUT' });
            if (open.workItemId) add('traces', { projectId: currentProject!.id, sourceType: 'WorkItem', sourceId: open.workItemId, targetType: 'Artifact', targetId: a.id, relationType: 'OUTPUT' });
            setRegistering(false);
            setOpenId('');
            toast('AI成果物として登録しました');
            nav(`/ai-artifacts/${a.id}`);
          }}
        />
      )}
      {comparing && ea && eb && diff && (
        <Modal wide title="回答比較" onClose={() => setComparing(false)}>
          <p className="muted">相手側にない行を色付きで示します。</p>
          <div className="two-col">
            {[{ e: ea, lines: diff.a }, { e: eb, lines: diff.b }].map(({ e, lines }) => (
              <Section key={e.id} title={`${e.id}(${labelOf(AI_TYPES, e.aiType)})`}>
                <div className="doc" style={{ padding: 6 }}>
                  {lines.map((l, i) => <div key={i} className={`diff-line ${l.diff ? 'diff' : ''}`}>{l.text || ' '}</div>)}
                </div>
              </Section>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

export default function Executions() {
  return (
    <>
      <PageHeader title="AI実行履歴" scr="SCR-031" />
      <RequireProject><Body /></RequireProject>
    </>
  );
}
