// データモデル設計書 v2 のエンティティ定義
export type ID = string;
export interface Base {
  id: ID;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'DONE';
export interface Project extends Base {
  name: string;
  description: string;
  status: ProjectStatus;
  rootPath: string;
}

export type ContextType = 'REQUIREMENT' | 'DESIGN' | 'TEST' | 'SOURCE' | 'PROJECT' | 'KNOWLEDGE';
export interface Context extends Base {
  projectId: ID;
  title: string;
  type: ContextType;
  content: string;
  sourceArtifactIds: ID[];
  tags: string[];
}

export type WorkItemType = 'TASK' | 'BUG' | 'QA' | 'REVIEW' | 'FIX';
export type WorkItemStatus = 'OPEN' | 'TODO' | 'DOING' | 'DONE' | 'CLOSED';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export interface WorkItem extends Base {
  projectId: ID;
  type: WorkItemType;
  title: string;
  description: string;
  status: WorkItemStatus;
  priority: Priority;
  assignee: string;
  parentId: ID;
  /** QA用の回答(設計書の拡張) */
  answer: string;
  /** QAのナレッジ化(FAQ化)フラグ(設計書の拡張) */
  isKnowledge: boolean;
}

export type PromptRole = 'PM' | 'REQ' | 'ARCH' | 'DB' | 'UI' | 'DES' | 'BE' | 'FE' | 'TEST' | 'REVIEW';
export interface Prompt extends Base {
  projectId: ID;
  name: string;
  role: PromptRole;
  template: string;
  outputFormat: string;
  version: string;
}

export type AIType = 'COPILOT' | 'GITHUB_COPILOT' | 'GEMINI';
export interface AIExecution extends Base {
  projectId: ID;
  workItemId: ID;
  promptId: ID;
  contextIds: ID[];
  requestText: string;
  responseText: string;
  executedAt: string;
  aiType: AIType;
}

export type ArtifactType =
  | 'REQUIREMENT' | 'DESIGN' | 'SCREEN' | 'DATABASE' | 'API' | 'SOURCE'
  | 'TEST' | 'MANUAL' | 'REVIEW' | 'FIX' | 'WBS' | 'PROMPT';
export type ArtifactStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'BASELINE';
/** 画面上の「ドキュメント」と「AI成果物」を区別する(設計書の拡張) */
export type ArtifactOrigin = 'MANUAL' | 'CONVERTED' | 'AI';
export interface ArtifactVersion {
  version: number;
  content: string;
  savedAt: string;
}
export interface Artifact extends Base {
  projectId: ID;
  workItemId: ID;
  artifactType: ArtifactType;
  title: string;
  path: string;
  content: string;
  status: ArtifactStatus;
  approved: boolean;
  origin: ArtifactOrigin;
  version: number;
  versions: ArtifactVersion[];
  reviewNote: string;
}

export type RelationType = 'INPUT' | 'OUTPUT' | 'DERIVED_FROM' | 'IMPLEMENTS' | 'VALIDATES' | 'REVIEWS' | 'FIXES';
export interface Traceability extends Base {
  projectId: ID;
  sourceType: string;
  sourceId: ID;
  targetType: string;
  targetId: ID;
  relationType: RelationType;
}

export interface Repository extends Base {
  projectId: ID;
  url: string;
  defaultBranch: string;
  currentBranch: string;
  worktreeRoot: string;
}

// 以下はGit/GitHub管理画面(SCR-041〜043)用の拡張エンティティ
export interface Branch extends Base {
  projectId: ID;
  repositoryId: ID;
  name: string;
  baseBranch: string;
  worktreePath: string;
}
export type PullRequestStatus = 'OPEN' | 'REVIEWING' | 'MERGED' | 'CLOSED';
export interface PullRequest extends Base {
  projectId: ID;
  repositoryId: ID;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: PullRequestStatus;
  reviewNote: string;
  mergedAt: string;
}
export interface Release extends Base {
  projectId: ID;
  repositoryId: ID;
  tag: string;
  note: string;
  releasedAt: string;
}
