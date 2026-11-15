import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { useStore } from './store';
import { nodeInfo, reachable } from './util';
import { RELATION_TYPES, labelOf, type Option } from './meta';

/* ---------- 基本部品 ---------- */
export function PageHeader({ title, scr, actions }: { title: string; scr?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {scr && <span className="scr">{scr}</span>}
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

export type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info';
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function statusTone(s: string): Tone {
  if (['DONE', 'APPROVED', 'BASELINE', 'MERGED', 'ACTIVE'].includes(s)) return 'ok';
  if (['DOING', 'REVIEW', 'REVIEWING'].includes(s)) return 'info';
  if (['HIGH'].includes(s)) return 'bad';
  if (['MEDIUM'].includes(s)) return 'warn';
  return 'neutral';
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}

export function DetailGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="detail-grid">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v || <span className="muted">未設定</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SearchBox({ value, onChange, placeholder = '検索' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="search" className="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function FilterSelect({ value, onChange, options, all, label }: { value: string; onChange: (v: string) => void; options: Option[]; all: string; label: string }) {
  return (
    <select className="filter" value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
      <option value="">{all}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} className={value === t.value ? 'active' : ''} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}
export function Table<T extends { id: string }>({ rows, columns, onRowClick, empty }: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (!rows.length) return <>{empty ?? <Empty title="該当するデータがありません" />}</>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c.header}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={onRowClick ? 'clickable' : ''} onClick={() => onRowClick?.(r)}>
              {columns.map((c) => <td key={c.header}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
/** 行内ボタンが行クリックを発火させないためのラッパー */
export function RowActions({ children }: { children: ReactNode }) {
  return <span className="row-actions" onClick={(e) => e.stopPropagation()}>{children}</span>;
}

/* ---------- モーダル / フォーム ---------- */
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost" onClick={onClose} aria-label="閉じる">閉じる</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export interface FieldDef {
  name: string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'checks';
  options?: Option[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
}
export type Values = Record<string, string | string[]>;

export function defaultValues(fields: FieldDef[], initial: Values = {}): Values {
  const v: Values = {};
  for (const f of fields) v[f.name] = initial[f.name] ?? (f.kind === 'checks' ? [] : '');
  return v;
}
export function firstMissing(fields: FieldDef[], values: Values): string | undefined {
  return fields.find((f) => f.required && (Array.isArray(values[f.name]) ? (values[f.name] as string[]).length === 0 : !String(values[f.name] ?? '').trim()))?.label;
}

export function FormFields({ fields, values, onChange }: { fields: FieldDef[]; values: Values; onChange: (name: string, v: string | string[]) => void }) {
  return (
    <>
      {fields.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={`f-${f.name}`}>{f.label}{f.required && <span className="req">必須</span>}</label>
          {f.kind === 'text' && (
            <input id={`f-${f.name}`} value={values[f.name] as string} placeholder={f.placeholder} onChange={(e) => onChange(f.name, e.target.value)} />
          )}
          {f.kind === 'textarea' && (
            <textarea id={`f-${f.name}`} rows={f.rows ?? 4} value={values[f.name] as string} placeholder={f.placeholder} onChange={(e) => onChange(f.name, e.target.value)} />
          )}
          {f.kind === 'select' && (
            <select id={`f-${f.name}`} value={values[f.name] as string} onChange={(e) => onChange(f.name, e.target.value)}>
              {!f.required && <option value="">指定しない</option>}
              {f.required && !values[f.name] && <option value="">選択してください</option>}
              {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          {f.kind === 'checks' && (
            <div className="checks" id={`f-${f.name}`}>
              {(f.options ?? []).length === 0 && <span className="muted">選択できる項目がありません</span>}
              {(f.options ?? []).map((o) => {
                const cur = values[f.name] as string[];
                return (
                  <label key={o.value} className="check">
                    <input type="checkbox" checked={cur.includes(o.value)} onChange={(e) => onChange(f.name, e.target.checked ? [...cur, o.value] : cur.filter((x) => x !== o.value))} />
                    {o.label}
                  </label>
                );
              })}
            </div>
          )}
          {f.hint && <p className="hint">{f.hint}</p>}
        </div>
      ))}
    </>
  );
}

export function FormModal({ title, fields, initial, submitLabel = '保存', onSubmit, onClose, wide }: {
  title: string;
  fields: FieldDef[];
  initial?: Values;
  submitLabel?: string;
  onSubmit: (v: Values) => void;
  onClose: () => void;
  wide?: boolean;
}) {
  const [values, setValues] = useState<Values>(() => defaultValues(fields, initial));
  const [error, setError] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const miss = firstMissing(fields, values);
    if (miss) return setError(`「${miss}」を入力してください`);
    onSubmit(values);
  };
  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form onSubmit={submit}>
        <FormFields fields={fields} values={values} onChange={(n, v) => setValues((p) => ({ ...p, [n]: v }))} />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>キャンセル</button>
          <button type="submit" className="btn primary">{submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- トースト ---------- */
type ToastTone = 'ok' | 'bad';
const ToastCtx = createContext<(msg: string, tone?: ToastTone) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: ToastTone }[]>([]);
  const seq = useRef(0);
  const push = useCallback((msg: string, tone: ToastTone = 'ok') => {
    const id = ++seq.current;
    setItems((x) => [...x, { id, msg, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => <div key={i.id} className={`toast ${i.tone}`}>{i.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- プロジェクト依存 ---------- */
export function RequireProject({ children }: { children: ReactNode }) {
  const { currentProject } = useStore();
  if (!currentProject) {
    return (
      <Empty
        title="プロジェクトが選択されていません"
        hint="作業はプロジェクト単位で行います。プロジェクトを登録または選択してください。"
        action={<Link className="btn primary" to="/projects">プロジェクト一覧へ</Link>}
      />
    );
  }
  return <>{children}</>;
}

/* ---------- トレーサビリティ表示 ---------- */
export function NodeLink({ id }: { id: string }) {
  const { scoped } = useStore();
  const n = nodeInfo(scoped, id);
  return <Link to={n.path}><span className="id">{n.id}</span> {n.label}</Link>;
}

export function RelatedLinks({ id }: { id: string }) {
  const { scoped } = useStore();
  const rows = scoped.traces.filter((t) => t.sourceId === id || t.targetId === id);
  return (
    <Section title="関連(トレーサビリティ)" actions={<Link to="/traceability" className="btn ghost">関連付けを管理</Link>}>
      {rows.length === 0 ? (
        <p className="muted">関連付けはまだありません。</p>
      ) : (
        <ul className="plain">
          {rows.map((t) => {
            const out = t.sourceId === id;
            return (
              <li key={t.id}>
                <Badge>{labelOf(RELATION_TYPES, t.relationType)}</Badge> {out ? '→' : '←'} <NodeLink id={out ? t.targetId : t.sourceId} />
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/** F-011-004 / F-012-005: 変更・課題の影響範囲 */
export function ImpactPanel({ id, depth = 3 }: { id: string; depth?: number }) {
  const { scoped } = useStore();
  const hits = [...reachable(scoped.traces, id, depth).entries()].sort((a, b) => a[1] - b[1]);
  return (
    <Section title="影響範囲">
      {hits.length === 0 ? (
        <p className="muted">関連付けされた項目がないため、影響範囲を特定できません。トレーサビリティを登録してください。</p>
      ) : (
        <ul className="plain">
          {hits.map(([nid, d]) => (
            <li key={nid}><Badge tone={d === 1 ? 'warn' : 'neutral'}>{d}段先</Badge> <NodeLink id={nid} /></li>
          ))}
        </ul>
      )}
    </Section>
  );
}
