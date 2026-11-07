import fs from "fs";
import http from "http";
import os from "os";
import path from "path";

import { afterEach, describe, expect, it } from "vitest";

import type { Task } from "@/models/Task";
import { createApp } from "@/app";

describe("task API integration", () => {
  const originalWorkingDirectory = process.cwd();
  let temporaryDirectory: string | undefined;
  let server: http.Server | undefined;

  afterEach(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
    server = undefined;

    process.chdir(originalWorkingDirectory);
    if (temporaryDirectory) {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
      temporaryDirectory = undefined;
    }
  });

  it("supports task filtering, CRUD, state transitions, and project counts", async () => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "task-api-integration-"),
    );
    const dataDirectory = path.join(temporaryDirectory, "data", "generated");
    fs.mkdirSync(dataDirectory, { recursive: true });
    const seedTask: Task = {
      id: "TSK-001",
      title: "Unassigned task",
      description: "",
      status: "TODO",
      priority: "NORMAL",
      source: "seed",
    };
    fs.writeFileSync(
      path.join(dataDirectory, "tasks.json"),
      JSON.stringify([seedTask]),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(dataDirectory, "documents.json"),
      JSON.stringify([
        {
          id: "DOC-001",
          title: "Assigned document",
          type: "DES",
          path: "docs/assigned.md",
          source: "seed",
          projectId: "PRJ-001",
        },
        {
          id: "DOC-002",
          title: "Unassigned document",
          type: "DES",
          path: "docs/unassigned.md",
          source: "seed",
        },
      ]),
      "utf-8",
    );
    process.chdir(temporaryDirectory);

    server = http.createServer(createApp());
    await new Promise<void>((resolve, reject) => {
      server?.once("error", reject);
      server?.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("The integration server did not start");
    }
    const baseUrl = `http://127.0.0.1:${address.port}/api`;

    const unassignedResponse = await fetch(
      `${baseUrl}/tasks?projectId=unassigned&page=1`,
    );
    expect(unassignedResponse.status).toBe(200);
    const unassigned = await unassignedResponse.json();
    expect(unassigned).toMatchObject({
      count: 1,
      items: [{ id: "TSK-001" }],
    });

    const invalidFilterResponse = await fetch(
      `${baseUrl}/tasks?status=INVALID`,
    );
    expect(invalidFilterResponse.status).toBe(400);

    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "New task",
        description: "Created through the API",
        status: "TODO",
        priority: "HIGH",
        projectId: "PRJ-001",
      }),
    });
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { item: Task };
    expect(created.item).toMatchObject({
      id: "TSK-031",
      title: "New task",
      status: "TODO",
      priority: "HIGH",
      projectId: "PRJ-001",
      source: "手動登録",
    });

    const detailResponse = await fetch(`${baseUrl}/tasks/TSK-031`);
    expect(detailResponse.status).toBe(200);
    const detail = (await detailResponse.json()) as { item: Task };
    expect(detail.item.id).toBe("TSK-031");

    const updateResponse = await fetch(`${baseUrl}/tasks/TSK-031`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Updated task",
        description: "Updated description",
        status: "DOING",
        priority: "LOW",
        projectId: "PRJ-001",
      }),
    });
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as { item: Task };
    expect(updated.item).toMatchObject({
      id: "TSK-031",
      title: "Updated task",
      status: "DOING",
      source: "手動登録",
    });

    const invalidTransitionResponse = await fetch(
      `${baseUrl}/tasks/TSK-031`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Updated task",
          description: "Updated description",
          status: "TODO",
          priority: "LOW",
          projectId: "PRJ-001",
        }),
      },
    );
    expect(invalidTransitionResponse.status).toBe(400);

    const missingResponse = await fetch(`${baseUrl}/tasks/TSK-999`);
    expect(missingResponse.status).toBe(404);

    const projectResponse = await fetch(`${baseUrl}/projects`);
    expect(projectResponse.status).toBe(200);
    const projects = (await projectResponse.json()) as {
      items: Array<{ taskCount: number; documentCount: number }>;
    };
    expect(projects.items[0]).toMatchObject({
      taskCount: 1,
      documentCount: 1,
    });
  });
});
