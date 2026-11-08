import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createAgentPlan,
  findAgentCandidates,
  getRepositoryState,
  listAgents
} from "../AgentToolsService";

const temporaryDirectories: string[] = [];

const createRepository = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-tools-"));
  temporaryDirectories.push(root);
  execFileSync("git", ["init", "-b", "feature/test"], { cwd: root });
  fs.mkdirSync(path.join(root, ".github", "agents"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".github", "agents", "backend.agent.md"),
    `---
name: Backend Agent
description: "Implement backend APIs and server-side behavior."
---
`
  );
  fs.writeFileSync(
    path.join(root, ".github", "agents", "security.agent.md"),
    `---
name: Security Agent
description: "Review security vulnerabilities and OWASP risks."
---
`
  );
  return root;
};

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) =>
    fs.rmSync(directory, { recursive: true, force: true })
  );
});

describe("AgentToolsService", () => {
  it("reports branch, working tree status, and worktrees", () => {
    const root = createRepository();
    const state = getRepositoryState(root);

    expect(state.root).toBe(root);
    expect(state.branch).toBe("feature/test");
    expect(state.clean).toBe(false);
    expect(state.worktrees).toContainEqual({
      path: root,
      branch: "feature/test",
      current: true
    });
  });

  it("loads agent metadata and ranks matching candidates", () => {
    const root = createRepository();

    expect(listAgents(root).map((agent) => agent.id)).toEqual([
      "backend",
      "security"
    ]);
    expect(findAgentCandidates("バックエンド API", root)[0]?.id).toBe("backend");
    expect(findAgentCandidates("OWASP 脆弱性レビュー", root)[0]?.id).toBe("security");
  });

  it("prioritizes .agents/agents definitions when present", () => {
    const root = createRepository();
    fs.mkdirSync(path.join(root, ".agents", "agents"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".agents", "agents", "backend.md"),
      `---
name: backend
displayName: "Backend Agent (AGT-BE)"
description: "Implement backend APIs and server-side behavior for Antigravity."
---
`
    );

    const agents = listAgents(root);
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe("backend");
    expect(agents[0].name).toBe("Backend Agent (AGT-BE)");
    expect(agents[0].file).toBe(".agents/agents/backend.md");
  });

  it("creates an advisory plan with the repository snapshot", () => {
    const root = createRepository();
    const plan = createAgentPlan("backend API", root);

    expect(plan.repository.root).toBe(root);
    expect(plan.candidateAgents[0]?.id).toBe("backend");
    expect(plan.nextSteps).toHaveLength(4);
  });

  it("rejects empty requests", () => {
    expect(() => createAgentPlan("  ", process.cwd())).toThrow(
      "A non-empty request is required"
    );
  });
});
