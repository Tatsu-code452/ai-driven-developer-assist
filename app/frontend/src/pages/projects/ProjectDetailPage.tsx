import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { deleteProject, getProject, updateProject } from "../../api/projectApi";
import type { Project, ProjectStatus } from "../../types/Project";

export const ProjectDetailPage = () => {
    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        if (!id) {
            return;
        }

        getProject(id)
            .then(setProject)
            .finally(() => setLoading(false));
    }, [id]);

    const save = async () => {
        if (!id || !project) {
            return;
        }

        await updateProject(id, project);

        alert("保存しました");
    };

    const remove = async () => {
        if (!id) {
            return;
        }

        if (!confirm("削除しますか？")) {
            return;
        }

        await deleteProject(id);

        navigate("/projects");
    };

    if (loading || !project) {
        return <div>loading...</div>;
    }

    return (
        <div
            style={{
                padding: 24,
            }}
        >
            <h1>プロジェクト詳細</h1>

            <div>
                <div>
                    <label>Project ID</label>

                    <div>{project.id}</div>
                </div>

                <div>
                    <label>名称</label>

                    <input
                        value={project.name}
                        onChange={(e) =>
                            setProject({
                                ...project,
                                name: e.target.value,
                            })
                        }
                    />
                </div>

                <div>
                    <label>説明</label>

                    <textarea
                        value={project.description ?? ""}
                        onChange={(e) =>
                            setProject({
                                ...project,
                                description: e.target.value,
                            })
                        }
                    />
                </div>

                <div>
                    <label>状態</label>

                    <select
                        value={project.status}
                        onChange={(e) =>
                            setProject({
                                ...project,
                                status: e.target.value as ProjectStatus,
                            })
                        }
                    >
                        <option value="PLANNING">PLANNING</option>

                        <option value="ACTIVE">ACTIVE</option>

                        <option value="SUSPENDED">SUSPENDED</option>

                        <option value="COMPLETED">COMPLETED</option>

                        <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                </div>

                <div>
                    <label>rootPath</label>

                    <input
                        value={project.rootPath}
                        onChange={(e) =>
                            setProject({
                                ...project,
                                rootPath: e.target.value,
                            })
                        }
                    />
                </div>
            </div>

            <hr />

            <h2>Repository</h2>

            <div>
                <p>URL</p>

                <p>Default Branch</p>

                <p>Current Branch</p>

                <p>Worktree Root</p>
            </div>

            <hr />

            <h2>関連管理</h2>

            <div>
                <button onClick={() => navigate("/contexts")}>Context</button>

                <button onClick={() => navigate("/workitems")}>WorkItem</button>

                <button onClick={() => navigate("/artifacts")}>Artifact</button>

                <button onClick={() => navigate("/prompts")}>Prompt</button>

                <button onClick={() => navigate("/executions")}>
                    AIExecution
                </button>

                <button onClick={() => navigate("/traceability")}>
                    Traceability
                </button>
            </div>

            <hr />

            <button onClick={save}>保存</button>

            <button onClick={remove}>削除</button>

            <button onClick={() => navigate("/projects")}>戻る</button>
        </div>
    );
};
