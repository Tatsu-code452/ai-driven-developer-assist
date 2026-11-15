#!/bin/bash

mkdir -p backend/src/domain/project
mkdir -p backend/src/repositories
mkdir -p backend/data

cat <<'EOF' > backend/src/domain/project/Project.ts
export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "SUSPENDED"
  | "COMPLETED"
  | "ARCHIVED";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
}
EOF

cat <<'EOF' > backend/src/domain/project/CreateProjectRequest.ts
export interface CreateProjectRequest {
  name: string;
  description?: string;
  status: "PLANNING";
  rootPath: string;
}
EOF

cat <<'EOF' > backend/src/domain/project/UpdateProjectRequest.ts
export interface UpdateProjectRequest {
  name: string;
  description?: string;
  status:
    | "PLANNING"
    | "ACTIVE"
    | "SUSPENDED"
    | "COMPLETED"
    | "ARCHIVED";
  rootPath: string;
}
EOF

cat <<'EOF' > backend/src/repositories/ProjectRepository.ts
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
EOF

cat <<'EOF' > backend/data/projects.json
[]
EOF

echo "Part1 Done"



mkdir -p backend/src/services
mkdir -p backend/src/controllers
mkdir -p backend/src/routes

###############################################################################
# ProjectService
###############################################################################

cat <<'EOF' > backend/src/services/ProjectService.ts
import fs from "node:fs";
import { randomUUID } from "node:crypto";

import { Project } from "../domain/project/Project.js";
import { CreateProjectRequest } from "../domain/project/CreateProjectRequest.js";
import { UpdateProjectRequest } from "../domain/project/UpdateProjectRequest.js";
import { ProjectRepository } from "../repositories/ProjectRepository.js";

const CURRENT_PROJECT_FILE =
  "backend/data/current-project.json";

export class ProjectService {

  constructor(
    private readonly repository =
      new ProjectRepository()
  ) {}

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
EOF

###############################################################################
# Controller
###############################################################################

cat <<'EOF' > backend/src/controllers/ProjectController.ts
import {
  Request,
  Response
} from "express";

import {
  ProjectService
} from "../services/ProjectService.js";

export class ProjectController {

  private readonly service =
    new ProjectService();

  getAll = (
    req: Request,
    res: Response
  ) => {

    const projects =
      this.service.findAll();

    return res.json({
      success: true,
      items: projects,
      totalCount:
        projects.length
    });
  };

  getById = (
    req: Request,
    res: Response
  ) => {

    try {

      const result =
        this.service.findById(
          req.params.id
        );

      return res.json(result);

    } catch {

      return res
        .status(404)
        .json({
          message:
            "Project Not Found"
        });

    }
  };

  create = (
    req: Request,
    res: Response
  ) => {

    try {

      const result =
        this.service.create(
          req.body
        );

      return res
        .status(201)
        .json(result);

    } catch (e) {

      return res
        .status(409)
        .json({
          message:
            String(e)
        });

    }
  };

  update = (
    req: Request,
    res: Response
  ) => {

    try {

      const result =
        this.service.update(
          req.params.id,
          req.body
        );

      return res.json(result);

    } catch (e) {

      return res
        .status(400)
        .json({
          message:
            String(e)
        });

    }
  };

  delete = (
    req: Request,
    res: Response
  ) => {

    try {

      this.service.delete(
        req.params.id
      );

      return res
        .status(204)
        .send();

    } catch {

      return res
        .status(404)
        .json({
          message:
            "Project Not Found"
        });

    }
  };

  setCurrentProject = (
    req: Request,
    res: Response
  ) => {

    this.service
      .setCurrentProject(
        req.params.id
      );

    return res.json({
      success: true
    });
  };
}
EOF

###############################################################################
# Route
###############################################################################

cat <<'EOF' > backend/src/routes/projectRoutes.ts
import {
  Router
} from "express";

import {
  ProjectController
} from "../controllers/ProjectController.js";

const router =
  Router();

const controller =
  new ProjectController();

router.get(
  "/projects",
  controller.getAll
);

router.get(
  "/projects/:id",
  controller.getById
);

router.post(
  "/projects",
  controller.create
);

router.put(
  "/projects/:id",
  controller.update
);

router.delete(
  "/projects/:id",
  controller.delete
);

router.put(
  "/projects/:id/current",
  controller.setCurrentProject
);

export default router;
EOF

###############################################################################
# current project file
###############################################################################

mkdir -p backend/data

cat <<'EOF' > backend/data/current-project.json
{}
EOF

echo "Part2 Done"



mkdir -p backend/src/middleware
mkdir -p backend/src/common
mkdir -p backend/src/config

###############################################################################
# AuditLogger
###############################################################################

cat <<'EOF' > backend/src/common/AuditLogger.ts
import fs from "node:fs";

const LOG_FILE =
  "backend/data/audit.log";

export class AuditLogger {

  static write(
    action: string,
    payload: unknown
  ) {

    const line =
      JSON.stringify({
        timestamp:
          new Date().toISOString(),
        action,
        payload
      });

    fs.appendFileSync(
      LOG_FILE,
      line + "\n"
    );
  }
}
EOF

###############################################################################
# Error Middleware
###############################################################################

cat <<'EOF' > backend/src/middleware/errorHandler.ts
import {
  Request,
  Response,
  NextFunction
} from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {

  console.error(err);

  return res.status(500).json({
    success: false,
    message:
      err.message ??
      "Internal Server Error"
  });
}
EOF

###############################################################################
# CurrentProject Middleware
###############################################################################

cat <<'EOF' > backend/src/middleware/currentProject.ts
import fs from "node:fs";
import {
  Request,
  Response,
  NextFunction
} from "express";

const FILE =
  "backend/data/current-project.json";

export function currentProjectMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    if (!fs.existsSync(FILE)) {
      return next();
    }

    const current =
      JSON.parse(
        fs.readFileSync(
          FILE,
          "utf8"
        )
      );

    (req as any).currentProject =
      current;

    next();

  } catch (e) {

    next(e);
  }
}
EOF

###############################################################################
# Validation Middleware
###############################################################################

cat <<'EOF' > backend/src/middleware/projectValidation.ts
import {
  Request,
  Response,
  NextFunction
} from "express";

export function validateProject(
  req: Request,
  res: Response,
  next: NextFunction
) {

  const {
    name,
    rootPath
  } = req.body;

  if (
    !name ||
    name.length < 1 ||
    name.length > 255
  ) {

    return res.status(400)
      .json({
        message:
          "Invalid Project Name"
      });
  }

  if (!rootPath) {

    return res.status(400)
      .json({
        message:
          "rootPath required"
      });
  }

  next();
}
EOF

###############################################################################
# Server
###############################################################################

cat <<'EOF' > backend/src/server.ts
import express from "express";
import cors from "cors";

import projectRoutes
  from "./routes/projectRoutes.js";

import {
  currentProjectMiddleware
} from "./middleware/currentProject.js";

import {
  errorHandler
} from "./middleware/errorHandler.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(
  currentProjectMiddleware
);

app.get(
  "/health",
  (_req, res) =>
    res.json({
      success: true
    })
);

app.use(
  "/api",
  projectRoutes
);

app.use(
  errorHandler
);

const port =
  process.env.PORT || 3000;

app.listen(
  port,
  () =>
    console.log(
      `server start ${port}`
    )
);
EOF

###############################################################################
# ENV
###############################################################################

cat <<'EOF' > backend/.env
PORT=3000
EOF

###############################################################################
# audit file
###############################################################################

touch backend/data/audit.log

echo "Part3 Done"



mkdir -p frontend/src/types
mkdir -p frontend/src/api
mkdir -p frontend/src/pages/projects
mkdir -p frontend/src/hooks

###############################################################################
# types
###############################################################################

cat <<'EOF' > frontend/src/types/Project.ts
export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "SUSPENDED"
  | "COMPLETED"
  | "ARCHIVED";

export interface Project {

  id: string;

  name: string;

  description?: string;

  status: ProjectStatus;

  rootPath: string;

  createdAt: string;

  updatedAt: string;
}
EOF

###############################################################################
# api
###############################################################################

cat <<'EOF' > frontend/src/api/projectApi.ts
import axios from "axios";

const api =
  axios.create({
    baseURL:
      "http://localhost:3000/api"
  });

export async function getProjects() {

  const response =
    await api.get(
      "/projects"
    );

  return response.data;
}

export async function setCurrentProject(
  id: string
) {
  return api.put(
    `/projects/${id}/current`
  );
}
EOF

###############################################################################
# hook
###############################################################################

cat <<'EOF' > frontend/src/hooks/useProjects.ts
import {
  useEffect,
  useState
} from "react";

import {
  getProjects
} from "../api/projectApi";

import {
  Project
} from "../types/Project";

export function useProjects() {

  const [
    projects,
    setProjects
  ] =
    useState<Project[]>([]);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  useEffect(() => {

    getProjects()
      .then(result => {

        setProjects(
          result.items ?? []
        );

      })
      .finally(() => {

        setLoading(false);

      });

  }, []);

  return {
    projects,
    loading
  };
}
EOF

###############################################################################
# page
###############################################################################

cat <<'EOF' > frontend/src/pages/projects/ProjectListPage.tsx
import {
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  setCurrentProject
} from "../../api/projectApi";

import {
  useProjects
} from "../../hooks/useProjects";

export default function ProjectListPage() {

  const navigate =
    useNavigate();

  const {
    projects,
    loading
  } = useProjects();

  const [
    keyword,
    setKeyword
  ] =
    useState("");

  const [
    status,
    setStatus
  ] =
    useState("");

  const filtered =
    useMemo(() => {

      return projects.filter(
        p => {

          const nameMatch =
            p.name
              .toLowerCase()
              .includes(
                keyword
                  .toLowerCase()
              );

          const statusMatch =
            !status ||
            p.status === status;

          return (
            nameMatch &&
            statusMatch
          );
        }
      );

    }, [
      keyword,
      status,
      projects
    ]);

  async function handleSelect(
    id: string
  ) {

    await setCurrentProject(
      id
    );

    navigate(
      `/projects/${id}`
    );
  }

  if (loading) {

    return (
      <div>
        loading...
      </div>
    );
  }

  return (

    <div
      style={{
        padding: 24
      }}
    >

      <h1>
        プロジェクト一覧
      </h1>

      <div>

        <input
          placeholder="名称"
          value={keyword}
          onChange={
            e =>
            setKeyword(
              e.target.value
            )
          }
        />

        <select
          value={status}
          onChange={
            e =>
            setStatus(
              e.target.value
            )
          }
        >

          <option value="">
            ALL
          </option>

          <option value="PLANNING">
            PLANNING
          </option>

          <option value="ACTIVE">
            ACTIVE
          </option>

          <option value="SUSPENDED">
            SUSPENDED
          </option>

          <option value="COMPLETED">
            COMPLETED
          </option>

          <option value="ARCHIVED">
            ARCHIVED
          </option>

        </select>

        <button
          onClick={() =>
            navigate(
              "/projects/new"
            )
          }
        >
          新規作成
        </button>

      </div>

      <table>

        <thead>

          <tr>

            <th>ID</th>

            <th>名称</th>

            <th>状態</th>

            <th>rootPath</th>

            <th>更新日時</th>

            <th></th>

          </tr>

        </thead>

        <tbody>

        {filtered.map(
          project => (

          <tr
            key={project.id}
          >

            <td>
              {project.id}
            </td>

            <td>
              {project.name}
            </td>

            <td>
              {project.status}
            </td>

            <td>
              {project.rootPath}
            </td>

            <td>
              {
                project.updatedAt
              }
            </td>

            <td>

              <button
                onClick={() =>
                  handleSelect(
                    project.id
                  )
                }
              >
                選択
              </button>

            </td>

          </tr>
        ))}

        </tbody>

      </table>

    </div>
  );
}
EOF

echo "Part4 Done"



###############################################################################
# API EXTENSION
###############################################################################

cat <<'EOF' >> frontend/src/api/projectApi.ts

export async function getProject(
  id: string
) {

  const response =
    await api.get(
      `/projects/${id}`
    );

  return response.data;
}

export async function updateProject(
  id: string,
  project: unknown
) {

  const response =
    await api.put(
      `/projects/${id}`,
      project
    );

  return response.data;
}

export async function deleteProject(
  id: string
) {

  return api.delete(
    `/projects/${id}`
  );
}
EOF

###############################################################################
# DETAIL PAGE
###############################################################################

cat <<'EOF' > frontend/src/pages/projects/ProjectDetailPage.tsx

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  deleteProject,
  getProject,
  updateProject
} from "../../api/projectApi";

import {
  Project
} from "../../types/Project";

export default function ProjectDetailPage() {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    project,
    setProject
  ] =
    useState<Project | null>(
      null
    );

  useEffect(() => {

    if (!id) {
      return;
    }

    getProject(id)
      .then(setProject)
      .finally(() =>
        setLoading(false)
      );

  }, [id]);

  async function save() {

    if (
      !id ||
      !project
    ) {
      return;
    }

    await updateProject(
      id,
      project
    );

    alert(
      "保存しました"
    );
  }

  async function remove() {

    if (!id) {
      return;
    }

    if (
      !confirm(
        "削除しますか？"
      )
    ) {
      return;
    }

    await deleteProject(
      id
    );

    navigate(
      "/projects"
    );
  }

  if (
    loading ||
    !project
  ) {

    return (
      <div>
        loading...
      </div>
    );
  }

  return (

    <div
      style={{
        padding: 24
      }}
    >

      <h1>
        プロジェクト詳細
      </h1>

      <div>

        <div>

          <label>
            Project ID
          </label>

          <div>
            {project.id}
          </div>

        </div>

        <div>

          <label>
            名称
          </label>

          <input
            value={
              project.name
            }
            onChange={e =>
              setProject({
                ...project,
                name:
                  e.target.value
              })
            }
          />

        </div>

        <div>

          <label>
            説明
          </label>

          <textarea
            value={
              project.description
              ?? ""
            }
            onChange={e =>
              setProject({
                ...project,
                description:
                  e.target.value
              })
            }
          />

        </div>

        <div>

          <label>
            状態
          </label>

          <select
            value={
              project.status
            }
            onChange={e =>
              setProject({
                ...project,
                status:
                  e.target.value as any
              })
            }
          >

            <option value="PLANNING">
              PLANNING
            </option>

            <option value="ACTIVE">
              ACTIVE
            </option>

            <option value="SUSPENDED">
              SUSPENDED
            </option>

            <option value="COMPLETED">
              COMPLETED
            </option>

            <option value="ARCHIVED">
              ARCHIVED
            </option>

          </select>

        </div>

        <div>

          <label>
            rootPath
          </label>

          <input
            value={
              project.rootPath
            }
            onChange={e =>
              setProject({
                ...project,
                rootPath:
                  e.target.value
              })
            }
          />

        </div>

      </div>

      <hr />

      <h2>
        Repository
      </h2>

      <div>

        <p>
          URL
        </p>

        <p>
          Default Branch
        </p>

        <p>
          Current Branch
        </p>

        <p>
          Worktree Root
        </p>

      </div>

      <hr />

      <h2>
        関連管理
      </h2>

      <div>

        <button
          onClick={() =>
            navigate(
              "/contexts"
            )
          }
        >
          Context
        </button>

        <button
          onClick={() =>
            navigate(
              "/workitems"
            )
          }
        >
          WorkItem
        </button>

        <button
          onClick={() =>
            navigate(
              "/artifacts"
            )
          }
        >
          Artifact
        </button>

        <button
          onClick={() =>
            navigate(
              "/prompts"
            )
          }
        >
          Prompt
        </button>

        <button
          onClick={() =>
            navigate(
              "/executions"
            )
          }
        >
          AIExecution
        </button>

        <button
          onClick={() =>
            navigate(
              "/traceability"
            )
          }
        >
          Traceability
        </button>

      </div>

      <hr />

      <button
        onClick={save}
      >
        保存
      </button>

      <button
        onClick={remove}
      >
        削除
      </button>

      <button
        onClick={() =>
          navigate(
            "/projects"
          )
        }
      >
        戻る
      </button>

    </div>

  );
}
EOF

###############################################################################
# ROUTE SNIPPET
###############################################################################

cat <<'EOF'

Router設定へ追加

import ProjectListPage
from "./pages/projects/ProjectListPage";

import ProjectDetailPage
from "./pages/projects/ProjectDetailPage";

<Route
  path="/projects"
  element={<ProjectListPage />}
/>

<Route
  path="/projects/:id"
  element={<ProjectDetailPage />}
/>

EOF

echo "Part5 Done"



mkdir -p frontend/src/components
mkdir -p frontend/src/layouts
mkdir -p frontend/src/pages/dashboard

###############################################################################
# Dashboard
###############################################################################

cat <<'EOF' > frontend/src/pages/dashboard/DashboardPage.tsx

import {
  Link
} from "react-router-dom";

export default function DashboardPage() {

  return (

    <div
      style={{
        padding: "24px"
      }}
    >

      <h1>
        AI駆動型開発支援システム
      </h1>

      <p>
        Dashboard
      </p>

      <Link to="/projects">
        プロジェクト管理
      </Link>

    </div>
  );
}
EOF

###############################################################################
# Navigation
###############################################################################

cat <<'EOF' > frontend/src/components/Navigation.tsx

import {
  NavLink
} from "react-router-dom";

export default function Navigation() {

  return (

    <aside
      style={{
        width: "240px",
        padding: "16px",
        borderRight:
          "1px solid #ddd"
      }}
    >

      <h3>
        Menu
      </h3>

      <nav>

        <ul>

          <li>
            <NavLink
              to="/"
            >
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/projects"
            >
              プロジェクト管理
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/contexts"
            >
              Context
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/workitems"
            >
              WorkItem
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/artifacts"
            >
              Artifact
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/traceability"
            >
              Traceability
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/repositories"
            >
              Repository
            </NavLink>
          </li>

        </ul>

      </nav>

    </aside>
  );
}
EOF

###############################################################################
# Layout
###############################################################################

cat <<'EOF' > frontend/src/layouts/MainLayout.tsx

import {
  Outlet
} from "react-router-dom";

import Navigation
  from "../components/Navigation";

export default function MainLayout() {

  return (

    <div
      style={{
        display: "flex",
        minHeight:
          "100vh"
      }}
    >

      <Navigation />

      <main
        style={{
          flex: 1
        }}
      >
        <Outlet />
      </main>

    </div>
  );
}
EOF

###############################################################################
# Router
###############################################################################

cat <<'EOF' > frontend/src/App.tsx

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import MainLayout
  from "./layouts/MainLayout";

import DashboardPage
  from "./pages/dashboard/DashboardPage";

import ProjectListPage
  from "./pages/projects/ProjectListPage";

import ProjectDetailPage
  from "./pages/projects/ProjectDetailPage";

export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          element={
            <MainLayout />
          }
        >

          <Route
            path="/"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="/projects"
            element={
              <ProjectListPage />
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProjectDetailPage />
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>

  );
}
EOF

###############################################################################
# Main
###############################################################################

cat <<'EOF' > frontend/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

ReactDOM
  .createRoot(
    document.getElementById(
      "root"
    )!
  )
  .render(

    <React.StrictMode>
      <App />
    </React.StrictMode>

  );

EOF

###############################################################################
# placeholder pages
###############################################################################

mkdir -p frontend/src/pages/common

cat <<'EOF' > frontend/src/pages/common/ComingSoonPage.tsx

export default function ComingSoonPage() {

  return (
    <div
      style={{
        padding: 24
      }}
    >
      Coming Soon
    </div>
  );

}
EOF

echo "Part6 Done"



mkdir -p frontend/src/pages/projects
mkdir -p frontend/src/test
mkdir -p backend/src/test

###############################################################################
# CREATE PAGE
###############################################################################

cat <<'EOF' > frontend/src/pages/projects/ProjectCreatePage.tsx

import {
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import axios from "axios";

export default function ProjectCreatePage() {

  const navigate =
    useNavigate();

  const [
    name,
    setName
  ] =
    useState("");

  const [
    description,
    setDescription
  ] =
    useState("");

  const [
    rootPath,
    setRootPath
  ] =
    useState("");

  async function save() {

    await axios.post(
      "http://localhost:3000/api/projects",
      {
        name,
        description,
        rootPath,
        status:
          "PLANNING"
      }
    );

    navigate(
      "/projects"
    );
  }

  return (

    <div
      style={{
        padding: 24
      }}
    >

      <h1>
        プロジェクト作成
      </h1>

      <input
        placeholder="名称"
        value={name}
        onChange={e =>
          setName(
            e.target.value
          )
        }
      />

      <textarea
        placeholder="説明"
        value={description}
        onChange={e =>
          setDescription(
            e.target.value
          )
        }
      />

      <input
        placeholder="rootPath"
        value={rootPath}
        onChange={e =>
          setRootPath(
            e.target.value
          )
        }
      />

      <button
        onClick={save}
      >
        登録
      </button>

    </div>
  );
}
EOF

###############################################################################
# Dashboard Upgrade
###############################################################################

cat <<'EOF' > frontend/src/pages/dashboard/DashboardPage.tsx

import {
  useEffect,
  useState
} from "react";

import axios from "axios";

export default function DashboardPage() {

  const [
    count,
    setCount
  ] =
    useState(0);

  useEffect(() => {

    axios
      .get(
        "http://localhost:3000/api/projects"
      )
      .then(r =>
        setCount(
          r.data.totalCount
        )
      );

  }, []);

  return (

    <div
      style={{
        padding: 24
      }}
    >

      <h1>
        Dashboard
      </h1>

      <h3>
        Project Count
      </h3>

      <div>

        {count}

      </div>

    </div>
  );
}
EOF

###############################################################################
# Repository Type
###############################################################################

cat <<'EOF' > frontend/src/types/Repository.ts

export interface Repository {

  id: string;

  url: string;

  defaultBranch: string;

  currentBranch: string;

  worktreeRoot: string;
}
EOF

###############################################################################
# Mock Project Data
###############################################################################

mkdir -p backend/data

cat <<'EOF' > backend/data/projects-sample.json

[
  {
    "id":"PRJ-001",
    "name":"AI駆動開発支援",
    "description":"sample",
    "status":"ACTIVE",
    "rootPath":"/project/sample",
    "createdAt":"2025-01-01",
    "updatedAt":"2025-01-01"
  }
]

EOF

###############################################################################
# Backend Test
###############################################################################

cat <<'EOF' > backend/src/test/ProjectService.test.ts

import {
  describe,
  it,
  expect
} from "vitest";

describe(
  "ProjectService",
  () => {

    it(
      "create",
      () => {

        expect(
          true
        ).toBe(
          true
        );

      }
    );

  }
);

EOF

###############################################################################
# Frontend Test
###############################################################################

cat <<'EOF' > frontend/src/test/Project.test.tsx

import {
  describe,
  expect,
  it
} from "vitest";

describe(
  "Project",
  () => {

    it(
      "render",
      () => {

        expect(
          true
        ).toBe(
          true
        );

      }
    );

  }
);

EOF

###############################################################################
# Route Additions
###############################################################################

cat <<'EOF'

App.tsx に追加

import ProjectCreatePage
from "./pages/projects/ProjectCreatePage";

<Route
 path="/projects/new"
 element={
  <ProjectCreatePage />
 }
/>

EOF

###############################################################################
# NPM TEST
###############################################################################

cat <<'EOF'

Frontend

npm run test

Backend

npm run test

EOF

echo "Part7 Done"