import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  Badge, Empty, FormModal, PageHeader, RequireProject, RowActions, Section, Table, Tabs, useToast, type FieldDef,
} from '../ui';
import { AI_TYPES, CONTEXT_TYPES, OUTPUT_FORMATS, PROMPT_ROLES, labelOf } from '../meta';
import { buildPrompt, errMsg } from '../util';
import { executeAI } from '../api';
import type { AIType, Prompt, PromptRole } from '../types';

const TPL_FIELDS: FieldDef[] = [
  { name: 'name', label: 'テンプレート名', kind: 'text', required: true },
  { name: 'role', label: 'ロール', kind: 'select', options: PROMPT_ROLES, required: true },
  { name: 'template', label: 'テンプレート本文', kind: 'textarea', rows: 10, required: true, hint: '{{role}} {{task}} {{contexts}} {{outputFormat}} が生成時に展開されます。書かなかった項目は末尾に追記されます。' },
  { name: 'outputFormat', label: '既定の出力形式', kind: 'text' },
  { name: 'version', label: '版', kind: 'text', required: true },
];

function Generator() {
  const { scoped, currentProject, add } = useStore();
  const toast = useToast();
  const [sp] = useSearchParams();
  const exe = scoped.executions.find((e) => e.id === sp.get('executionId'));
  const initialCtx = exe?.contextIds ?? (sp.get('contextId') ? [sp.get('contextId') as string] : []);

  const [promptId, setPromptId] = useState(exe?.promptId ?? scoped.prompts[0]?.id ?? '');
  const [workItemId, setWorkItemId] = useState(exe?.workItemId ?? sp.get('workItemId') ?? '');
  const [contextIds, setContextIds] = useState<string[]>(initialCtx);
  const [outputFormat, setOutputFormat] = useState('');
  const [generated, setGenerated] = useState(exe?.requestText ?? '');
  const [response, setResponse] = useState('');
  const [aiType, setAiType] = useState<AIType>(exe?.aiType ?? 'COPILOT');
  const [busy, setBusy] = useState(false);

  const tpl = scoped.prompts.find((p) => p.id === promptId);
  const generate = () => {
    if (!tpl) return toast('テンプレートを選択してください', 'bad');
    setGenerated(buildPrompt({
      template: tpl.template, role: tpl.role, task: scoped.workItems.find((w) => w.id === workItemId),
      contexts: scoped.contexts.filter((c) => contextIds.includes(c.id)), outputFormat: outputFormat.trim() || tpl.outputFormat,
    }));
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(generated); toast('プロンプトをコピーしました'); } catch { toast('コピーできませんでした。テキストを選択してコピーしてください', 'bad'); }
  };
  const run = async () => {
    setBusy(true);
    try { setResponse(await executeAI(aiType, generated)); toast('AIの回答を取得しました'); } catch (e) { toast(errMsg(e), 'bad'); } finally { setBusy(false); }
  };
  const save = async () => {
    const e = await add('executions', { projectId: currentProject!.id, workItemId, promptId, contextIds, requestText: generated, responseText: response, executedAt: new Date().toISOString(), aiType });
    if (!e) return;
    toast(`AI実行履歴 ${e.id} に保存しました`);
  };

  if (scoped.prompts.length === 0) return <Empty title="プロンプトテンプレートがありません" hint="「テンプレート管理」タブから登録してください。" />;
  return (
    <div className="two-col" style={{ alignItems: 'start' }}>
      <div>
        <div className="field">
          <label htmlFor="tpl">テンプレート</label>
          <select id="tpl" value={promptId} onChange={(e) => setPromptId(e.target.value)}>
            {scoped.prompts.map((p) => <option key={p.id} value={p.id}>{p.name}({labelOf(PROMPT_ROLES, p.role)})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="wi">タスク</label>
          <select id="wi" value={workItemId} onChange={(e) => setWorkItemId(e.target.value)}>
            <option value="">指定しない</option>
            {scoped.workItems.map((w) => <option key={w.id} value={w.id}>{w.id} {w.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label>コンテキスト</label>
          <div className="checks">
            {scoped.contexts.length === 0 && <span className="muted">コンテキストが未登録です</span>}
            {scoped.contexts.map((c) => (
              <label key={c.id} className="check">
                <input type="checkbox" checked={contextIds.includes(c.id)} onChange={(e) => setContextIds(e.target.checked ? [...contextIds, c.id] : contextIds.filter((x) => x !== c.id))} />
                {c.title} <Badge>{labelOf(CONTEXT_TYPES, c.type)}</Badge>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="of">出力形式</label>
          <input id="of" list="formats" value={outputFormat} placeholder={tpl?.outputFormat || '選択または入力'} onChange={(e) => setOutputFormat(e.target.value)} />
          <datalist id="formats">{OUTPUT_FORMATS.map((f) => <option key={f} value={f} />)}</datalist>
          <p className="hint">空欄ならテンプレートの既定値を使います。</p>
        </div>
        <button className="btn primary" onClick={generate}>プロンプトを生成</button>
      </div>

      <div>
        <div className="field">
          <label htmlFor="gen">生成されたプロンプト(編集できます)</label>
          <textarea id="gen" rows={14} value={generated} onChange={(e) => setGenerated(e.target.value)} placeholder="左の条件を選んで「プロンプトを生成」を押してください" />
        </div>
        <div className="toolbar">
          <button className="btn" disabled={!generated} onClick={copy}>コピー</button>
          <select aria-label="AI種別" value={aiType} onChange={(e) => setAiType(e.target.value as AIType)}>
            {AI_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button className="btn" disabled={!generated || busy} onClick={run}>{busy ? '実行中…' : 'APIで実行'}</button>
        </div>
        <div className="field">
          <label htmlFor="res">AIの回答</label>
          <textarea id="res" rows={10} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="APIで実行するか、外部のAIで得た回答をここに貼り付けます" />
        </div>
        <button className="btn primary" disabled={!generated} onClick={save}>実行履歴に保存</button>
      </div>
    </div>
  );
}

function Templates() {
  const { scoped, currentProject, add, update, remove } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<Prompt | 'new' | null>(null);
  return (
    <>
      <div className="toolbar"><button className="btn primary" onClick={() => setEditing('new')}>テンプレートを登録</button></div>
      <Table
        rows={scoped.prompts}
        empty={<Empty title="テンプレートがありません" />}
        columns={[
          { header: 'ID', render: (p) => <span className="id">{p.id}</span> },
          { header: '名称', render: (p) => p.name },
          { header: 'ロール', render: (p) => <Badge>{labelOf(PROMPT_ROLES, p.role)}</Badge> },
          { header: '出力形式', render: (p) => p.outputFormat },
          { header: '版', render: (p) => p.version },
          { header: '', render: (p) => (
            <RowActions>
              <button className="btn" onClick={() => setEditing(p)}>編集</button>
              <button className="btn danger" onClick={async () => { if (confirm(`「${p.name}」を削除します。よろしいですか?`) && (await remove('prompts', p.id))) toast('削除しました'); }}>削除</button>
            </RowActions>
          ) },
        ]}
      />
      {editing && (
        <FormModal
          wide title={editing === 'new' ? 'テンプレート登録' : 'テンプレート編集'} fields={TPL_FIELDS}
          initial={editing === 'new' ? { role: 'REQ', version: '1.0', template: '## タスク\n{{task}}\n\n## コンテキスト\n{{contexts}}\n\n## 出力形式\n{{outputFormat}}' } : { name: editing.name, role: editing.role, template: editing.template, outputFormat: editing.outputFormat, version: editing.version }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const body = { name: v.name as string, role: v.role as PromptRole, template: v.template as string, outputFormat: v.outputFormat as string, version: v.version as string };
            const saved = editing === 'new' ? await add('prompts', { ...body, projectId: currentProject!.id }) : await update('prompts', editing.id, body);
            if (!saved) return;
            setEditing(null);
            toast('保存しました');
          }}
        />
      )}
    </>
  );
}

export default function Prompts() {
  const [tab, setTab] = useState('gen');
  return (
    <>
      <PageHeader title="プロンプト生成" scr="SCR-030" />
      <RequireProject>
        <Tabs tabs={[{ value: 'gen', label: 'プロンプト生成' }, { value: 'tpl', label: 'テンプレート管理' }]} value={tab} onChange={setTab} />
        {tab === 'gen' ? <Generator /> : <Templates />}
        <Section title="使い方"><p className="muted">コンテキストとタスクを選んでプロンプトを生成し、コピーして外部のAIに渡すか、バックエンド接続時は「APIで実行」で回答を取得します。回答は実行履歴に保存してください。</p></Section>
      </RequireProject>
    </>
  );
}
