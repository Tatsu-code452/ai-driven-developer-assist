import fs from "fs";
import path from "path";

import type { ProjectInput, ProjectRecord } from "@/models/Project";
import { getNextId } from "@/services/idGenerator/IdGenerator";
import { isStringProperty } from "@/utils/propUtils";
import { isObject } from "@/utils/typeUtils";

const FILE_NAME = "projects.json";

const INITIAL_PROJECT: ProjectRecord = {
  id: "PRJ-001",
  name: "AI駆動型開発支援システム",
  description: "",
  status: "進行中",
  rootPath: "",
};

const isProjectRecord = (value: unknown): value is ProjectRecord =>
  isObject(value) &&
  isStringProperty(value, "id") &&
  isStringProperty(value, "name") &&
  isStringProperty(value, "description") &&
  isStringProperty(value, "status") &&
  isStringProperty(value, "rootPath");


export const loadProjects = (outputDir: string): ProjectRecord[] => {
  const filePath = path.join(outputDir, FILE_NAME);

  if (!fs.existsSync(filePath)) {
    return [{ ...INITIAL_PROJECT }];
  }

  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (!Array.isArray(parsed) || !parsed.every(isProjectRecord)) {
    throw new Error("プロジェクトデータの形式が不正です");
  }

  return parsed as ProjectRecord[];
};

export const loadProjectById = (
  id: string,
  outputDir: string,
): ProjectRecord | undefined => {
  const projects = loadProjects(outputDir);
  return projects.find((project) => project.id === id);
};

export const saveProjects = (
  projects: ProjectRecord[],
  outputDir: string,
): string => {
  fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, FILE_NAME);
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(projects, null, 2), "utf-8");
  fs.renameSync(temporaryPath, filePath);

  return filePath;
};

export const createProject = (
  input: ProjectInput,
  outputDir: string,
): ProjectRecord => {
  const projects = loadProjects(outputDir);
  const project: ProjectRecord = {
    ...input,
    id: getNextId("PRJ", projects),
  };

  if (projects.some((item) => item.id === project.id)) {
    throw new Error(`プロジェクトIDが重複しています: ${project.id}`);
  }

  saveProjects([...projects, project], outputDir);
  return project;
};

export const updateProject = (
  id: string,
  input: ProjectInput,
  outputDir: string,
): ProjectRecord | undefined => {
  const projects = loadProjects(outputDir);
  const index = projects.findIndex((project) => project.id === id);

  if (index === -1) {
    return undefined;
  }

  const updated: ProjectRecord = { ...input, id };
  projects[index] = updated;
  saveProjects(projects, outputDir);

  return updated;
};