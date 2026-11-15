export interface Option {
  value: string;
  label: string;
}
const o = (pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));

export const PROJECT_STATUS = o([['PLANNING', '計画中'], ['ACTIVE', '進行中'], ['DONE', '完了']]);
export const CONTEXT_TYPES = o([
  ['REQUIREMENT', '要件'], ['DESIGN', '設計'], ['TEST', 'テスト'],
  ['SOURCE', 'ソース'], ['PROJECT', 'プロジェクト'], ['KNOWLEDGE', 'ナレッジ'],
]);
export const WORKITEM_TYPES = o([
  ['TASK', 'タスク'], ['REVIEW', 'レビュー'], ['FIX', '修正'], ['BUG', '課題'], ['QA', 'QA'],
]);
export const PRIORITIES = o([['HIGH', '高'], ['MEDIUM', '中'], ['LOW', '低']]);
export const PROMPT_ROLES = o([
  ['PM', 'PM'], ['REQ', '要件定義'], ['ARCH', 'アーキテクト'], ['DB', 'DB設計'], ['UI', 'UI設計'],
  ['DES', '詳細設計'], ['BE', 'バックエンド'], ['FE', 'フロントエンド'], ['TEST', 'テスト'], ['REVIEW', 'レビュー'],
]);
export const AI_TYPES = o([['COPILOT', 'Copilot'], ['GITHUB_COPILOT', 'GitHub Copilot'], ['GEMINI', 'Gemini']]);
export const ARTIFACT_TYPES = o([
  ['REQUIREMENT', '要件'], ['DESIGN', '設計'], ['SCREEN', '画面'], ['DATABASE', 'DB'], ['API', 'API'],
  ['SOURCE', 'ソース'], ['TEST', 'テスト'], ['MANUAL', '手順書'], ['REVIEW', 'レビュー'],
  ['FIX', '修正'], ['WBS', 'WBS'], ['PROMPT', 'プロンプト'],
]);
export const ARTIFACT_STATUS = o([
  ['DRAFT', '下書き'], ['REVIEW', 'レビュー中'], ['APPROVED', '承認済み'], ['BASELINE', 'ベースライン'],
]);
export const RELATION_TYPES = o([
  ['INPUT', '入力'], ['OUTPUT', '出力'], ['DERIVED_FROM', '派生元'], ['IMPLEMENTS', '実装'],
  ['VALIDATES', '検証'], ['REVIEWS', 'レビュー'], ['FIXES', '修正'],
]);
export const PR_STATUS = o([
  ['OPEN', 'オープン'], ['REVIEWING', 'レビュー中'], ['MERGED', 'マージ済み'], ['CLOSED', 'クローズ'],
]);
export const OUTPUT_FORMATS = [
  'Markdown(見出し付き・箇条書き中心)',
  'JSON',
  '表形式(Markdownテーブル)',
  'git apply 用の差分パッチ',
  'シェルスクリプト',
];

export const labelOf = (opts: Option[], v: string) => opts.find((x) => x.value === v)?.label ?? v;
