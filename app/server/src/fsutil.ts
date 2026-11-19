import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/** 一時ファイルに書いて fsync し、rename で置き換える(書き込み途中のファイルが残らない)。backup 指定時は直前の版を .bak に残す */
export function writeJsonAtomic(file: string, value: unknown, opts: { backup?: boolean; pretty?: boolean } = {}): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  const data = JSON.stringify(value, null, opts.pretty === false ? undefined : 2);
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, data);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  if (opts.backup && fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`);
  fs.renameSync(tmp, file);
}

/** 読み込む。本体が壊れている/無いときは .bak から復旧する。どちらも無ければ undefined、壊れていて復旧できなければ例外 */
export function readJsonRecoverable<T>(file: string): { value: T; recovered: boolean } | undefined {
  const read = (f: string): T | undefined => (fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as T) : undefined);
  let primaryError: unknown;
  try {
    const v = read(file);
    if (v !== undefined) return { value: v, recovered: false };
  } catch (e) {
    primaryError = e;
  }
  try {
    const b = read(`${file}.bak`);
    if (b !== undefined) return { value: b, recovered: true };
  } catch {
    /* バックアップも壊れている */
  }
  if (primaryError) throw new Error(`${path.basename(file)} が壊れており、バックアップからも復旧できません`);
  return undefined;
}

export const statOf = (file: string) => {
  try {
    const s = fs.statSync(file);
    return { size: s.size, mtimeMs: s.mtimeMs };
  } catch {
    return { size: 0, mtimeMs: 0 };
  }
};
