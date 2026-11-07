import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type AgentDefinition = {
  id: string;
  name: string;
  description: string;
  file: string;
};

export type AgentCandidate = AgentDefinition & {
  score: number;
  matchedCapabilities: string[];
};

export type RepositoryState = {
  root: string;
  branch: string;
  status: string[];
  clean: boolean;
  worktrees: {
    path: string;
    branch: string;
    current: boolean;
  }[];
};

const agentCapabilities: Record<string, string[]> = {
  "architecture": ["architecture", "system design", "アーキテクチャ", "システム設計"],
  "backend": ["backend", "server", "api", "バックエンド", "サーバー"],
  "cd": ["deployment", "release", "rollback", "デプロイ", "リリース"],
  "ci": ["ci", "build", "lint", "coverage", "ビルド", "静的解析"],
  "database": ["database", "schema", "sql", "データベース", "スキーマ", "DB"],
  "detail-design": ["detailed design", "api contract", "interface", "詳細設計", "API仕様"],
  "documentation": ["documentation", "readme", "docs", "ドキュメント", "文書"],
  "fix": ["fix", "requested changes", "修正", "不具合対応"],
  "frontend": ["frontend", "client-side", "フロントエンド", "画面実装"],
  "git": ["git", "branch", "commit", "rebase", "ブランチ", "コミット"],
  "github": ["github", "pull request", "issue", "プルリクエスト", "イシュー"],
  "knowledge": ["handoff", "project knowledge", "コンテキスト整理", "ナレッジ"],
  "performance": ["performance", "optimization", "パフォーマンス", "最適化"],
  "project-audit": ["audit", "quality analysis", "プロジェクト監査", "品質監査"],
  "project-manager": ["planning", "wbs", "schedule", "estimate", "計画", "見積", "スケジュール"],
  "prompt-engineer": ["prompt", "agent prompt", "プロンプト"],
  "requirement": ["requirement", "acceptance criteria", "要件", "受入条件"],
  "review": ["review", "code review", "レビュー", "コードレビュー"],
  "security": ["security", "vulnerability", "owasp", "セキュリティ", "脆弱性"],
  "test-design": ["test strategy", "test cases", "テスト設計", "テストケース"],
  "test-execution": ["test execution", "run tests", "テスト実行", "テスト実施"],
  "traceability": ["traceability", "traceability matrix", "トレーサビリティ", "追跡可能性"],
  "uiux": ["ux", "usability", "wireframe", "UX", "ユーザビリティ", "ワイヤーフレーム"]
};

const runGit = (root: string, args: string[]): string =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();

export const getRepositoryState = (
  workingDirectory = process.cwd()
): RepositoryState => {
  const root = path.resolve(
    runGit(workingDirectory, ["rev-parse", "--show-toplevel"])
  );
  const branch = runGit(root, ["branch", "--show-current"]);
  const status = runGit(root, ["status", "--short", "--branch"])
    .split(/\r?\n/)
    .filter(Boolean);
  const worktreeOutput = runGit(root, ["worktree", "list", "--porcelain"]);
  const worktrees: RepositoryState["worktrees"] = [];
  let worktree: RepositoryState["worktrees"][number] | undefined;

  for (const line of worktreeOutput.split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      if (worktree) {
        worktrees.push(worktree);
      }

      const worktreePath = path.resolve(line.slice("worktree ".length));
      worktree = {
        path: worktreePath,
        branch: "",
        current: path.resolve(worktreePath) === path.resolve(root)
      };
    } else if (line.startsWith("branch ") && worktree) {
      worktree.branch = line
        .slice("branch ".length)
        .replace(/^refs\/heads\//, "");
    }
  }

  if (worktree) {
    worktrees.push(worktree);
  }

  return {
    root,
    branch,
    status,
    clean: status.every((line) => line.startsWith("##")),
    worktrees
  };
};

const readFrontmatterValue = (frontmatter: string, key: string): string => {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));

  if (!match) {
    throw new Error(`Agent definition is missing "${key}" metadata.`);
  }

  return match[1].trim().replace(/^(['"])(.*)\1$/, "$2");
};

export const listAgents = (
  repositoryRoot = getRepositoryState().root
): AgentDefinition[] => {
  const agentsDirectory = path.join(repositoryRoot, ".github", "agents");
  const files = fs.readdirSync(agentsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".agent.md"))
    .map((entry) => entry.name)
    .sort();

  return files.map((file) => {
    const absolutePath = path.join(agentsDirectory, file);
    const content = fs.readFileSync(absolutePath, "utf8");
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];

    if (!frontmatter) {
      throw new Error(`Agent definition has invalid frontmatter: ${file}`);
    }

    return {
      id: file.replace(/\.agent\.md$/, ""),
      name: readFrontmatterValue(frontmatter, "name"),
      description: readFrontmatterValue(frontmatter, "description"),
      file: path.posix.join(".github", "agents", file)
    };
  });
};

export const findAgentCandidates = (
  request: string,
  repositoryRoot = getRepositoryState().root
): AgentCandidate[] => {
  const normalizedRequest = request.toLocaleLowerCase();

  if (!normalizedRequest.trim()) {
    return [];
  }

  const requestWords = new Set(
    normalizedRequest
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 2)
  );

  return listAgents(repositoryRoot)
    .map((agent) => {
      const capabilities = agentCapabilities[agent.id] ?? [];
      const matchedCapabilities = capabilities.filter((capability) =>
        normalizedRequest.includes(capability.toLocaleLowerCase())
      );
      const text = `${agent.name} ${agent.description}`.toLocaleLowerCase();
      const descriptionMatches = text
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length > 2)
        .filter((word) => requestWords.has(word));
      const score = matchedCapabilities.length * 2 + descriptionMatches.length;

      return {
        ...agent,
        score,
        matchedCapabilities
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) =>
      right.score - left.score || left.name.localeCompare(right.name)
    )
    .slice(0, 5);
};

export const createAgentPlan = (
  request: string,
  workingDirectory = process.cwd()
) => {
  const trimmedRequest = request.trim();

  if (!trimmedRequest) {
    throw new Error("A non-empty request is required to create an agent plan.");
  }

  const repository = getRepositoryState(workingDirectory);

  return {
    request: trimmedRequest,
    repository,
    candidateAgents: findAgentCandidates(trimmedRequest, repository.root),
    nextSteps: [
      "Confirm the ticket scope, allowed files, and deliverables.",
      "Choose the appropriate specialist(s) from the candidates; this tool does not invoke agents.",
      "Pass the verified repository root and relevant context to each specialist.",
      "Run the required review and validation before completion."
    ]
  };
};
