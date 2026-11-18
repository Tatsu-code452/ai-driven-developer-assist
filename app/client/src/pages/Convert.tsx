import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { PageHeader, RequireProject, Section, useToast } from '../ui';
import { ARTIFACT_TYPES } from '../meta';
import { convertFile, extOf, isLocallyReadable } from '../api';
import { errMsg } from '../util';
import type { ArtifactType } from '../types';

function Body() {
  const { currentProject, add } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ArtifactType>('REQUIREMENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = (f: File | null) => {
    setFile(f);
    setText('');
    setError('');
    setTitle(f ? f.name.replace(/\.[^.]+$/, '') : '');
  };
  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      setText(await convertFile(file));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const register = async () => {
    const a = await add('artifacts', {
      projectId: currentProject!.id, workItemId: '', artifactType: type, title: title.trim() || file!.name, path: file!.name, content: text,
      status: 'DRAFT', approved: false, origin: 'CONVERTED', version: 1, versions: [], reviewNote: '',
    });
    if (!a) return;
    toast('ドキュメントとして登録しました');
    nav(`/documents/${a.id}`);
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <Section title="1. ファイルを選ぶ">
        <input type="file" aria-label="変換するファイル" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.json" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <p className="hint">テキスト系(txt, md, csv, json など)はブラウザ内で変換します。PDF / Word / Excel はバックエンドの変換API(POST /api/convert)が必要です。</p>
        {file && !isLocallyReadable(file) && <p className="hint">「.{extOf(file.name)}」は変換APIを使用します。</p>}
      </Section>
      <Section title="2. テキストに変換する">
        <button className="btn primary" disabled={!file || busy} onClick={convert}>{busy ? '変換中…' : 'テキストに変換'}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </Section>
      {text && (
        <Section title="3. 結果を確認して登録する">
          <div className="field"><label htmlFor="t">タイトル</label><input id="t" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field">
            <label htmlFor="ty">分類</label>
            <select id="ty" value={type} onChange={(e) => setType(e.target.value as ArtifactType)}>
              {ARTIFACT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="c">変換結果(編集できます)</label><textarea id="c" rows={14} value={text} onChange={(e) => setText(e.target.value)} /></div>
          <button className="btn primary" onClick={register}>ドキュメントとして登録</button>
        </Section>
      )}
    </div>
  );
}

export default function Convert() {
  return (
    <>
      <PageHeader title="ファイル変換" scr="SCR-025" />
      <RequireProject><Body /></RequireProject>
    </>
  );
}
