import fs from "node:fs";
import path from "node:path";
import { Project } from "../domain/project/Project.js";

const DATA_FILE =
  path.resolve(process.cwd(), "backend/data/projects.json");

export class ProjectRepository {

  private read(): Project[] {

    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }

    const json =
      fs.readFileSync(DATA_FILE, "utf-8");

    return JSON.parse(json);
  }

  private write(projects: Project[]) {

    fs.mkdirSync(
      path.dirname(DATA_FILE),
      { recursive: true }
    );

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(projects, null, 2),
      "utf-8"
    );
  }

  findAll(): Project[] {
    return this.read();
  }

  findById(id: string): Project | undefined {
    return this.read().find(
      x => x.id === id
    );
  }

  findByRootPath(
    rootPath: string
  ): Project | undefined {
    return this.read().find(
      x => x.rootPath === rootPath
    );
  }

  save(project: Project) {

    const projects = this.read();

    projects.push(project);

    this.write(projects);

    return project;
  }

  update(project: Project) {

    const projects =
      this.read().map(x =>
        x.id === project.id
          ? project
          : x
      );

    this.write(projects);

    return project;
  }

  delete(id: string) {

    const projects =
      this.read().filter(
        x => x.id !== id
      );

    this.write(projects);
  }
}
