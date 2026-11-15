// F-003: PDF / Word / Excel / テキスト → テキスト変換(外部ライブラリなし)
import zlib from 'node:zlib';
import { HttpError } from './errors.ts';

const TEXT_EXT = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'yaml', 'yml', 'xml', 'html', 'log'];
export const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

/* ---------- ZIP (docx / xlsx) ---------- */
function readZip(buf: Buffer): Map<string, Buffer> {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new HttpError(422, 'ZIP形式として読み取れません。ファイルが壊れているか、対応形式ではありません');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nlen).toString('utf8');
    p += 46 + nlen + elen + clen;
    const dStart = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
    const raw = buf.subarray(dStart, dStart + csize);
    if (method === 0) files.set(name, raw);
    else if (method === 8) files.set(name, zlib.inflateRawSync(raw));
  }
  return files;
}

const unxml = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

export function docxToText(buf: Buffer): string {
  const xml = readZip(buf).get('word/document.xml')?.toString('utf8');
  if (!xml) throw new HttpError(422, 'Word文書(word/document.xml)が見つかりません');
  let out = '';
  for (const m of xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<\/w:p>|<w:tab\s*\/>|<w:br\s*\/>|<\/w:tc>|<\/w:tr>/g)) {
    if (m[1] !== undefined) out += unxml(m[1]);
    else if (m[0] === '</w:p>' || m[0].startsWith('<w:br')) out += '\n';
    else if (m[0] === '</w:tc>') out = out.replace(/\n$/, '') + '\t'; // セル末尾の段落改行はタブに置き換える
    else if (m[0] === '</w:tr>') out = out.replace(/\t$/, '') + '\n';
    else out += '\t';
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

const colIndex = (ref: string) => [...ref.replace(/[0-9]/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

export function xlsxToText(buf: Buffer): string {
  const files = readZip(buf);
  const sstXml = files.get('xl/sharedStrings.xml')?.toString('utf8') ?? '';
  const shared = [...sstXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unxml([...m[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((t) => t[1]).join('')));
  const wb = files.get('xl/workbook.xml')?.toString('utf8') ?? '';
  const names = [...wb.matchAll(/<sheet\b[^>]*\bname="([^"]*)"/g)].map((m) => unxml(m[1]));
  const sheets = [...files.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10));
  if (sheets.length === 0) throw new HttpError(422, 'Excelブック(xl/worksheets)が見つかりません');
  const out: string[] = [];
  sheets.forEach((file, i) => {
    out.push(`## ${names[i] ?? `Sheet${i + 1}`}`);
    const xml = files.get(file)!.toString('utf8');
    for (const row of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: string[] = [];
      for (const c of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1];
        const idx = colIndex(/\br="([A-Z]+\d+)"/.exec(attrs)?.[1] ?? 'A1');
        const type = /\bt="([^"]*)"/.exec(attrs)?.[1];
        const inner = c[2] ?? '';
        let val = '';
        if (type === 's') val = shared[Number(/<v>([^<]*)<\/v>/.exec(inner)?.[1])] ?? '';
        else if (type === 'inlineStr') val = unxml([...inner.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((t) => t[1]).join(''));
        else val = unxml(/<v>([^<]*)<\/v>/.exec(inner)?.[1] ?? '');
        cells[idx] = val.replace(/[\t\r\n]+/g, ' ');
      }
      out.push(Array.from(cells, (v) => v ?? '').join('\t').trimEnd());
    }
    out.push('');
  });
  return out.join('\n').trim();
}

/* ---------- PDF (簡易: 標準的な文字列オペレータのみ) ---------- */
function unescapePdf(s: string): string {
  return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, e: string) => {
    if (/^[0-7]+$/.test(e)) return String.fromCharCode(parseInt(e, 8));
    return ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' } as Record<string, string>)[e] ?? e;
  });
}
export function pdfToText(buf: Buffer): string {
  const bin = buf.toString('latin1');
  const out: string[] = [];
  for (const m of bin.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    const before = bin.slice(Math.max(0, m.index - 300), m.index);
    let content = Buffer.from(m[1], 'latin1');
    if (/FlateDecode/.test(before)) {
      try { content = zlib.inflateSync(content); } catch { continue; }
    }
    const text = content.toString('latin1');
    if (!/\bBT\b/.test(text)) continue;
    let line = '';
    for (const t of text.matchAll(/\(((?:\\.|[^\\()])*)\)\s*Tj|\[((?:\\.|[^\]])*)\]\s*TJ|\bT\*|\bET\b|\bT[dD]\b/g)) {
      if (t[1] !== undefined) line += unescapePdf(t[1]);
      else if (t[2] !== undefined) line += [...t[2].matchAll(/\(((?:\\.|[^\\()])*)\)/g)].map((x) => unescapePdf(x[1])).join('');
      else { if (line.trim()) out.push(line); line = ''; }
    }
    if (line.trim()) out.push(line);
  }
  const text = out.join('\n').trim();
  if (!text) throw new HttpError(422, 'PDFからテキストを抽出できませんでした(スキャン画像、または日本語などの埋め込みフォントのPDFは未対応です)');
  return text;
}

export function convertToText(filename: string, data: Buffer): string {
  const ext = extOf(filename);
  if (TEXT_EXT.includes(ext)) return data.toString('utf8').replace(/^\uFEFF/, '');
  if (ext === 'docx') return docxToText(data);
  if (ext === 'xlsx') return xlsxToText(data);
  if (ext === 'pdf') return pdfToText(data);
  throw new HttpError(415, `「.${ext}」は未対応です。対応形式: pdf, docx, xlsx, ${TEXT_EXT.join(', ')}(旧形式の doc / xls は docx / xlsx に保存し直してください)`);
}
