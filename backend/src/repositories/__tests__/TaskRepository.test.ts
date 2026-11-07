import fs from "fs";
import os from "os";
import path from "path";

import { afterEach, describe, expect, it } from "vitest";

import type { Task, TaskInput } from "@/models/Task";
import {
  createTask,
  findTask,
  listTasks,
  loadTasks,
  saveTasks,
  updateTask,
} from "@/repositories/TaskRepository";

const temporaryDirectories: string[] = [];

const createTemporaryDirectory = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "task-repository-"));
  temporaryDirectories.push(directory);
  return directory;
};

const makeTask = (id: number, projectId?: string): Task => ({
  id: `TSK-${String(id).padStart(3, "0")}`,
  title: `Task ${id}`,
  description: "",
  status: "TODO",
  priority: "NORMAL",
  source: "test",
  projectId,
});

const makeInput = (title: string): TaskInput => ({
  title,
  description: "",
  status: "TODO",
  priority: "NORMAL",
  projectId: "PRJ-001",
});

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("TaskRepository", () => {
  it("returns an empty list when the generated task file does not exist", () => {
    expect(loadTasks(createTemporaryDirectory())).toEqual([]);
  });

  it("rejects malformed task data instead of treating it as a valid empty list", () => {
    const directory = createTemporaryDirectory();
    fs.writeFileSync(path.join(directory, "tasks.json"), "{}", "utf-8");

    expect(() => loadTasks(directory)).toThrow("Invalid task data");
  });

  it("filters and paginates tasks in ID order", () => {
    const tasks = Array.from({ length: 25 }, (_, index) =>
      makeTask(25 - index, index % 2 === 0 ? undefined : "PRJ-001"),
    );

    const firstPage = listTasks(tasks, {
      q: "task",
      projectId: "unassigned",
      status: "TODO",
      priority: "NORMAL",
      page: 1,
    });

    expect(firstPage.count).toBe(13);
    expect(firstPage.items).toHaveLength(13);
    expect(firstPage.items[0].id).toBe("TSK-001");
    expect(firstPage.totalPages).toBe(1);
    expect(firstPage.pageSize).toBe(20);
  });

  it("paginates more than one page", () => {
    const tasks = Array.from({ length: 25 }, (_, index) =>
      makeTask(index + 1, "PRJ-001"),
    );

    const firstPage = listTasks(tasks, { q: "", page: 1 });
    const secondPage = listTasks(tasks, { q: "", page: 2 });

    expect(firstPage.items).toHaveLength(20);
    expect(firstPage.items[0].id).toBe("TSK-001");
    expect(secondPage.items).toHaveLength(5);
    expect(secondPage.items[0].id).toBe("TSK-021");
    expect(secondPage.page).toBe(2);
  });

  it("starts new project task IDs after the WBS-reserved TSK-001 through TSK-030 range", () => {
    const directory = createTemporaryDirectory();
    saveTasks([makeTask(1), makeTask(8)], directory);

    const first = createTask(makeInput("New task"), directory);
    const second = createTask(makeInput("Another task"), directory);

    expect(first.id).toBe("TSK-031");
    expect(first.source).toBe("手動登録");
    expect(second.id).toBe("TSK-032");
    expect(loadTasks(directory)).toHaveLength(4);
  });

  it("updates a task without changing its ID or source", () => {
    const directory = createTemporaryDirectory();
    saveTasks([makeTask(31)], directory);
    const updated = updateTask(
      "TSK-031",
      { ...makeInput("Updated task"), status: "DOING" },
      directory,
    );

    expect(updated).toMatchObject({
      id: "TSK-031",
      title: "Updated task",
      status: "DOING",
      source: "test",
      projectId: "PRJ-001",
    });
    expect(findTask("TSK-031", directory)).toEqual(updated);
    expect(updateTask("TSK-999", makeInput("Missing"), directory)).toBeUndefined();
  });
});
