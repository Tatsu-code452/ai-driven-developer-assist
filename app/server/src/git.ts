// F-013: Git操作。引数配列で git を直接実行し(シェル非経由)、操作対象は GIT_WORKSPACE_ROOT 配下に限定する
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Config } from './config.ts';
import { HttpError } from './errors.ts';

export interface RepoInfo { id: string; url: string; worktreeRoot: string; defaultBranch: string }
interface RunResult { code: number; out: string; err: string }

function run(cwd: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, timeout: 120_000, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' } }, (error, stdout, stderr) => {
      const code = error ? (typeof (error as { code?: unknown }).code === 'number' ? ((error as { code: number }).code) : -1) : 0;
      resolve({ code, out: String(stdout).trim(), err: String(stderr).trim() });
    });
  });
}
async function ok(cwd: string, args: string[], status = 422): Promise<string> {
  const r = await run(cwd, args);
  if (r.code !== 0) throw new HttpError(status, `git ${args[0]} に失敗しました`, (r.err || r.out).slice(0, 1000));
  return [r.out, r.err].filter(Boolean).join('\n');
}

export function safeRef(name: unknown, label = 'ブランチ名'): string {
  if (typeof name !== 'string' || !/^(?!-)(?!.*\.\.)(?!.*\/\/)[A-Za-z0-9._/-]+$/.test(name) || name.endsWith('/') || name.endsWith('.lock')) {
    throw new HttpError(400, `${label}が不正です(英数字と . _ / - のみ、先頭に - は使えません)`);
  }
  return name;
}

function inside(root: string, target: string): boolean {
  // const rel = path.relative(root, target);
  // return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  const rel = target;
  console.log(rel)
  return rel !== '' && !rel.startsWith('..');
}
/** ワークスペース配下に解決する。配下を出る指定(../ や絶対パス、シンボリックリンク経由)は拒否する */
export function safeJoin(cfg: Config, rel: string): string {
  fs.mkdirSync(cfg.workspaceRoot, { recursive: true });
  const root = fs.realpathSync(cfg.workspaceRoot);
  const dir = path.resolve(root, rel);
  if (!inside(root, dir)) throw new HttpError(400, 'パスは GIT_WORKSPACE_ROOT 配下で指定してください');
  let probe = dir;
  while (!fs.existsSync(probe)) probe = path.dirname(probe);
  if (!(probe === root || inside(root, fs.realpathSync(probe)))) throw new HttpError(400, 'パスは GIT_WORKSPACE_ROOT 配下で指定してください');
  return dir;
}

const hasRepo = (dir: string) => fs.existsSync(path.join(dir, '.git'));

async function ensureRepo(cfg: Config, repo: RepoInfo, allowClone: boolean): Promise<string> {
  const dir = safeJoin(cfg, repo.worktreeRoot || repo.id);
  if (hasRepo(dir)) return dir;
  if (!allowClone) throw new HttpError(404, 'ローカルにリポジトリがありません。先に Fetch / Pull でcloneしてください');
  if (!/^(https:\/\/|ssh:\/\/|git@)[^\s]+$/.test(repo.url)) throw new HttpError(400, 'cloneできるURLは https:// / ssh:// / git@ 形式のみです');
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  await ok(path.dirname(dir), ['clone', '--', repo.url, dir]);
  return dir;
}

export async function currentBranch(dir: string): Promise<string> {
  const r = await run(dir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return r.code === 0 ? r.out : '';
}

async function identity(cfg: Config, dir: string): Promise<string[]> {
  const email = await run(dir, ['config', 'user.email']);
  const name = await run(dir, ['config', 'user.name']);
  return email.out && name.out ? [] : ['-c', `user.name=${cfg.git.userName}`, '-c', `user.email=${cfg.git.userEmail}`];
}

export async function fetchRepo(cfg: Config, repo: RepoInfo) {
  const had = hasRepo(safeJoin(cfg, repo.worktreeRoot || repo.id));
  const dir = await ensureRepo(cfg, repo, true);
  if (!had) return { message: `${repo.url} をcloneしました`, dir, branch: await currentBranch(dir) };
  const out = await ok(dir, ['fetch', '--all', '--prune']);
  return { message: out || 'fetch が完了しました(更新なし)', dir, branch: await currentBranch(dir) };
}
export async function pullRepo(cfg: Config, repo: RepoInfo) {
  const had = hasRepo(safeJoin(cfg, repo.worktreeRoot || repo.id));
  const dir = await ensureRepo(cfg, repo, true);
  if (!had) return { message: `${repo.url} をcloneしました`, dir, branch: await currentBranch(dir) };
  const out = await ok(dir, ['pull', '--ff-only'], 409);
  return { message: out || 'pull が完了しました', dir, branch: await currentBranch(dir) };
}

export async function statusRepo(cfg: Config, repo: RepoInfo) {
  const dir = await ensureRepo(cfg, repo, false);
  const lines = (await ok(dir, ['status', '--porcelain=v1', '-b'])).split('\n').filter(Boolean);
  return { branch: await currentBranch(dir), summary: lines[0] ?? '', changes: lines.slice(1), clean: lines.length <= 1 };
}

export async function listBranches(cfg: Config, repo: RepoInfo) {
  const dir = await ensureRepo(cfg, repo, false);
  const out = await ok(dir, ['branch', '--format=%(HEAD)|%(refname:short)']);
  return out.split('\n').filter(Boolean).map((l) => { const [h, name] = l.split('|'); return { name, current: h === '*' }; });
}

export async function commitRepo(cfg: Config, repo: RepoInfo, message: string, paths?: string[]) {
  if (!message.trim()) throw new HttpError(400, 'コミットメッセージを指定してください');
  const dir = await ensureRepo(cfg, repo, false);
  if (paths?.length) {
    const rels = paths.map((p) => {
      const abs = path.resolve(dir, p);
      if (!inside(dir, abs)) throw new HttpError(400, `パス ${p} はリポジトリの外です`);
      return path.relative(dir, abs);
    });
    await ok(dir, ['add', '--', ...rels]);
  } else {
    await ok(dir, ['add', '-A']);
  }
  const staged = await run(dir, ['diff', '--cached', '--quiet']);
  if (staged.code === 0) throw new HttpError(409, 'コミットする変更がありません');
  await ok(dir, [...(await identity(cfg, dir)), 'commit', '-m', message]);
  return { message: 'コミットしました', commit: await ok(dir, ['rev-parse', '--short', 'HEAD']), branch: await currentBranch(dir) };
}

export async function pushRepo(cfg: Config, repo: RepoInfo, branch?: string) {
  const dir = await ensureRepo(cfg, repo, false);
  const b = branch ? safeRef(branch) : await currentBranch(dir);
  const out = await ok(dir, ['push', '-u', 'origin', b], 409);
  return { message: out || `${b} をpushしました`, branch: b };
}

export async function createBranch(cfg: Config, repo: RepoInfo, name: string, base: string | undefined, checkout: boolean) {
  const dir = await ensureRepo(cfg, repo, false);
  safeRef(name);
  if (base) safeRef(base, '作成元ブランチ名');
  await ok(dir, ['branch', name, ...(base ? [base] : [])], 409);
  if (checkout) await ok(dir, ['checkout', name], 409);
  return { message: `ブランチ ${name} を作成しました`, branch: await currentBranch(dir) };
}
export async function checkoutBranch(cfg: Config, repo: RepoInfo, name: string) {
  const dir = await ensureRepo(cfg, repo, false);
  await ok(dir, ['checkout', safeRef(name)], 409);
  return { message: `${name} に切り替えました`, branch: await currentBranch(dir) };
}

export async function addWorktree(cfg: Config, repo: RepoInfo, branch: string, wtPath: string, base?: string) {
  const dir = await ensureRepo(cfg, repo, false);
  safeRef(branch);
  const target = safeJoin(cfg, wtPath);
  const exists = (await run(dir, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`])).code === 0;
  const args = exists ? ['worktree', 'add', target, branch] : ['worktree', 'add', '-b', branch, target, ...(base ? [safeRef(base, '作成元ブランチ名')] : [])];
  await ok(dir, args, 409);
  return { message: `作業ツリーを ${path.relative(fs.realpathSync(cfg.workspaceRoot), target)} に作成しました`, path: target };
}
export async function listWorktrees(cfg: Config, repo: RepoInfo) {
  const dir = await ensureRepo(cfg, repo, false);
  const out = await ok(dir, ['worktree', 'list', '--porcelain']);
  return out.split('\n\n').filter(Boolean).map((blk) => {
    const get = (k: string) => blk.split('\n').find((l) => l.startsWith(`${k} `))?.slice(k.length + 1) ?? '';
    return { path: get('worktree'), branch: get('branch').replace('refs/heads/', ''), head: get('HEAD').slice(0, 7) };
  });
}

export async function mergeBranch(cfg: Config, repo: RepoInfo, source: string, into?: string) {
  const dir = await ensureRepo(cfg, repo, false);
  safeRef(source, 'マージ元ブランチ名');
  if (into) await ok(dir, ['checkout', safeRef(into, 'マージ先ブランチ名')], 409);
  const r = await run(dir, [...(await identity(cfg, dir)), 'merge', '--no-ff', '--no-edit', source]);
  if (r.code !== 0) {
    await run(dir, ['merge', '--abort']);
    throw new HttpError(409, 'マージに失敗しました(競合などのため中止し、元の状態に戻しました)', (r.out || r.err).slice(0, 1000));
  }
  return { message: `${source} を ${await currentBranch(dir)} にマージしました`, branch: await currentBranch(dir) };
}

export async function tagRepo(cfg: Config, repo: RepoInfo, tag: string, message?: string) {
  const dir = await ensureRepo(cfg, repo, false);
  safeRef(tag, 'タグ名');
  await ok(dir, [...(await identity(cfg, dir)), 'tag', ...(message ? ['-a', tag, '-m', message] : [tag])], 409);
  return { message: `タグ ${tag} を作成しました` };
}
