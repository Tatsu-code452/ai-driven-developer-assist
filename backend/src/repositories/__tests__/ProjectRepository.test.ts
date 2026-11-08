import fs from "fs";
import os from "os";
import path from "path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createProject,
  loadProjects,
  updateProject,
} from "@/repositories/ProjectRepository";

const directories: string[] = [];

const createOutputDir = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "project-repository-"));
  directories.push(directory);
  return directory;
};

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("ProjectRepository", () => {
  it("uses the existing project as initial data when no file exists", () => {
    const projects = loadProjects(createOutputDir());

    expect(projects).toEqual([
      {
        id: "PRJ-001",
        name: "AI駆動型開発支援システム",
        description: "",
        status: "進行中",
        rootPath: "",
      },
    ]);
  });

  it("creates and persists projects with the next project ID", () => {
    const outputDir = createOutputDir();
    const input = {
      name: "新規プロジェクト",
      description: "説明",
      status: "",
      rootPath: "",
    };

    const created = createProject(input, outputDir);

    expect(created).toEqual({ ...input, id: "PRJ-002" });
    expect(loadProjects(outputDir)).toContainEqual(created);
  });

  it("updates a project without changing its ID", () => {
    const outputDir = createOutputDir();
    const updated = updateProject(
      "PRJ-001",
      { name: "更新名", description: "説明", status: "計画中", rootPath: "" },
      outputDir,
    );

    expect(updated).toEqual({
      id: "PRJ-001",
      name: "更新名",
      description: "説明",
      status: "計画中",
      rootPath: "",
    });
    expect(loadProjects(outputDir)).toContainEqual(updated);
  });

  it("does not create a replacement for an unknown project", () => {
    const outputDir = createOutputDir();

    expect(
      updateProject(
        "PRJ-999",
        { name: "更新名", description: "", status: "", rootPath: "" },
        outputDir,
      ),
    ).toBeUndefined();
    expect(loadProjects(outputDir)).toHaveLength(1);
  });

  it("reports invalid stored JSON shape instead of returning empty data", () => {
    const outputDir = createOutputDir();
    fs.writeFileSync(
      path.join(outputDir, "projects.json"),
      JSON.stringify({ id: "PRJ-001" }),
    );

    expect(() => loadProjects(outputDir)).toThrow("プロジェクトデータの形式が不正です");
  });
});
