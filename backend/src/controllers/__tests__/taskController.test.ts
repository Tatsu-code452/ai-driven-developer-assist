import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "@/models/Task";
import * as taskRepository from "@/repositories/TaskRepository";
import {
  getTaskDetail,
  getTasks,
  postTask,
  putTask,
} from "@/controllers/taskController";

vi.mock("@/repositories/TaskRepository", () => ({
  createTask: vi.fn(),
  findTask: vi.fn(),
  loadTasks: vi.fn(),
  listTasks: vi.fn(),
  updateTask: vi.fn(),
}));

const task: Task = {
  id: "TSK-031",
  title: "Test task",
  description: "",
  status: "TODO",
  priority: "NORMAL",
  source: "手動登録",
  projectId: "PRJ-001",
};

const makeResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

const makeRequest = (
  values: Partial<Pick<Request, "body" | "query" | "params">>,
) => values as Request;

describe("taskController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies validated filters and returns the paged list", () => {
    const response = makeResponse();
    const result = {
      items: [task],
      count: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(taskRepository.loadTasks).mockReturnValue([task]);
    vi.mocked(taskRepository.listTasks).mockReturnValue(result);

    getTasks(
      makeRequest({
        query: {
          q: "test",
          projectId: "PRJ-001",
          status: "TODO",
          priority: "NORMAL",
          page: "1",
        },
      }),
      response,
    );

    expect(taskRepository.listTasks).toHaveBeenCalledWith(
      [task],
      {
        q: "test",
        projectId: "PRJ-001",
        status: "TODO",
        priority: "NORMAL",
        page: 1,
      },
    );
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      ...result,
    });
  });

  it("rejects invalid pagination input", () => {
    const response = makeResponse();

    getTasks(makeRequest({ query: { page: "0" } }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(taskRepository.loadTasks).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown task ID", () => {
    const response = makeResponse();
    vi.mocked(taskRepository.findTask).mockReturnValue(undefined);

    getTaskDetail(makeRequest({ params: { id: "TSK-999" } }), response);

    expect(response.status).toHaveBeenCalledWith(404);
  });

  it("requires a project and title when creating a task", () => {
    const response = makeResponse();

    postTask(makeRequest({ body: { title: "New task" } }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(taskRepository.createTask).not.toHaveBeenCalled();
  });

  it("creates a task in TODO state", () => {
    const response = makeResponse();
    vi.mocked(taskRepository.createTask).mockReturnValue(task);

    postTask(
      makeRequest({
        body: {
          ...task,
          status: "TODO",
        },
      }),
      response,
    );

    expect(taskRepository.createTask).toHaveBeenCalledWith(
      {
        title: task.title,
        description: task.description,
        status: "TODO",
        priority: task.priority,
        projectId: task.projectId,
      },
      "data/generated",
    );
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it("rejects a state transition that skips DOING", () => {
    const response = makeResponse();
    vi.mocked(taskRepository.findTask).mockReturnValue(task);

    putTask(
      makeRequest({
        params: { id: task.id },
        body: { ...task, status: "DONE" },
      }),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(taskRepository.updateTask).not.toHaveBeenCalled();
  });

  it("allows reopening a completed task to DOING", () => {
    const response = makeResponse();
    const completedTask: Task = { ...task, status: "DONE" };
    vi.mocked(taskRepository.findTask).mockReturnValue(completedTask);
    vi.mocked(taskRepository.updateTask).mockReturnValue({
      ...completedTask,
      status: "DOING",
    });

    putTask(
      makeRequest({
        params: { id: task.id },
        body: { ...task, status: "DOING" },
      }),
      response,
    );

    expect(taskRepository.updateTask).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ status: "DOING" }),
      "data/generated",
    );
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      item: { ...completedTask, status: "DOING" },
    });
  });
});
