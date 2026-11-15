import fs from "node:fs";

import { CreateProjectRequest } from "../domain/project/CreateProjectRequest.js";
import { Project } from "../domain/project/Project.js";
import { UpdateProjectRequest } from "../domain/project/UpdateProjectRequest.js";
import { ProjectRepository } from "../repositories/ProjectRepository.js";

const CURRENT_PROJECT_FILE =
  "backend/data/current-project.json";

export class ProjectService {

  constructor(
    private readonly repository =
      new ProjectRepository()
  ) { }

  private nextId() {

    const projects =
      this.repository.findAll();

    const maxNo =
      projects.reduce((max, current) => {

        const no =
          Number(
            current.id.replace("PRJ-", "")
          );

        return Math.max(max, no);

      }, 0);

    return `PRJ-${String(maxNo + 1)
      .padStart(3, "0")}`;
  }

  create(
    request: CreateProjectRequest
  ) {

    if (
      this.repository.findByRootPath(
        request.rootPath
      )
    ) {
      throw new Error(
        "DUPLICATE_ROOT_PATH"
      );
    }

    const now =
      new Date().toISOString();

    const project: Project = {
      id: this.nextId(),
      name: request.name,
      description:
        request.description,
      status: "PLANNING",
      rootPath: request.rootPath,
      createdAt: now,
      updatedAt: now
    };

    return this.repository.save(
      project
    );
  }

  findAll() {
    return this.repository.findAll();
  }

  findById(id: string) {

    const project =
      this.repository.findById(id);

    if (!project) {
      throw new Error(
        "PROJECT_NOT_FOUND"
      );
    }

    return project;
  }

  update(
    id: string,
    request: UpdateProjectRequest
  ) {

    const project =
      this.findById(id);

    this.validateStatusTransition(
      project.status,
      request.status
    );

    const duplicated =
      this.repository
        .findByRootPath(
          request.rootPath
        );

    if (
      duplicated &&
      duplicated.id !== id
    ) {
      throw new Error(
        "DUPLICATE_ROOT_PATH"
      );
    }

    const updated = {
      ...project,
      ...request,
      updatedAt:
        new Date().toISOString()
    };

    return this.repository.update(
      updated
    );
  }

  delete(id: string) {

    const project =
      this.findById(id);

    this.repository.delete(
      project.id
    );
  }

  setCurrentProject(
    projectId: string
  ) {

    fs.writeFileSync(
      CURRENT_PROJECT_FILE,
      JSON.stringify({
        projectId
      }, null, 2)
    );
  }

  getCurrentProject() {

    if (
      !fs.existsSync(
        CURRENT_PROJECT_FILE
      )
    ) {
      return null;
    }

    return JSON.parse(
      fs.readFileSync(
        CURRENT_PROJECT_FILE,
        "utf-8"
      )
    );
  }

  private validateStatusTransition(
    from: string,
    to: string
  ) {

    const allowed: Record<
      string,
      string[]
    > = {

      PLANNING: [
        "ACTIVE"
      ],

      ACTIVE: [
        "SUSPENDED",
        "COMPLETED"
      ],

      SUSPENDED: [
        "ACTIVE",
        "COMPLETED"
      ],

      COMPLETED: [
        "ARCHIVED"
      ],

      ARCHIVED: []
    };

    if (from === to) {
      return;
    }

    if (
      !allowed[from]?.includes(to)
    ) {
      throw new Error(
        "INVALID_STATUS_TRANSITION"
      );
    }
  }
}
