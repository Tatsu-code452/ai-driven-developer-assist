import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { apiErrorMessage } from "../services/api";
import {
    createProject,
    fetchProject,
    updateProject,
} from "../services/projectApi";
import type { Project, ProjectInput } from "../types/Api";

const emptyProject: ProjectInput = {
    name: "",
    description: "",
    status: "",
};

const listLocationFrom = (value: string | null) =>
    value && /^\/projects(?:\?|$)/.test(value) ? value : "/projects";

export const ProjectDetailPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = searchParams.get("id");
    const createMode = searchParams.get("mode") === "create";
    const editMode = createMode || searchParams.get("mode") === "edit";
    const returnTo = listLocationFrom(searchParams.get("returnTo"));
    const [loadedProject, setLoadedProject] = useState<{
        id: string;
        value: Project;
    }>();
    const [form, setForm] = useState<ProjectInput>(emptyProject);
    const [loadError, setLoadError] = useState<{
        key: string;
        message: string;
    }>();
    const [saveError, setSaveError] = useState("");
    const [saving, setSaving] = useState(false);
    const [retry, setRetry] = useState(0);
    const project = loadedProject?.id === id ? loadedProject.value : undefined;
    const requestKey = `${createMode ? "create" : id ?? "missing"}:${retry}`;
    const currentLoadError =
        loadError?.key === requestKey ? loadError.message : "";
    const loading =
        !createMode &&
        !!id &&
        loadedProject?.id !== id &&
        !currentLoadError;

    useEffect(() => {
        let active = true;
        if (createMode || !id) {
            return () => {
                active = false;
            };
        }

        fetchProject(id)
            .then((result) => {
                if (!active) return;
                setLoadedProject({ id, value: result });
                setForm({
                    name: result.name,
                    description: result.description,
                    status: result.status,
                });
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setLoadError({
                    key: requestKey,
                    message: apiErrorMessage(
                        cause,
                        "プロジェクトを読み込めませんでした",
                    ),
                });
            });

        return () => {
            active = false;
        };
    }, [createMode, id, requestKey]);

    const originalForm = useMemo(
        () =>
            project
                ? {
                      name: project.name,
                      description: project.description,
                      status: project.status,
                  }
                : emptyProject,
        [project],
    );
    const dirty = JSON.stringify(form) !== JSON.stringify(originalForm);

    const cancelEdit = () => {
        if (dirty && !window.confirm("未保存の変更を破棄しますか？")) return;
        if (createMode) {
            navigate(returnTo);
            return;
        }

        const next = new URLSearchParams(searchParams);
        next.delete("mode");
        setSearchParams(next);
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim()) {
            setSaveError("名称を入力してください。");
            return;
        }
        if (!createMode && !id) {
            setSaveError(
                "対象IDが指定されていません。プロジェクト一覧から選択してください。",
            );
            return;
        }

        setSaving(true);
        setSaveError("");
        const input = {
            name: form.name.trim(),
            description: form.description,
            status: form.status,
        };

        try {
            let saved: Project;
            if (createMode) {
                saved = await createProject(input);
            } else if (id) {
                saved = await updateProject(id, input);
            } else {
                return;
            }

            setLoadedProject({ id: saved.id, value: saved });
            setForm({
                name: saved.name,
                description: saved.description,
                status: saved.status,
            });

            if (createMode) {
                setSearchParams({ id: saved.id, returnTo });
            } else {
                const next = new URLSearchParams(searchParams);
                next.delete("mode");
                setSearchParams(next);
            }
        } catch (cause: unknown) {
            setSaveError(
                apiErrorMessage(cause, "プロジェクトを保存できませんでした"),
            );
        } finally {
            setSaving(false);
        }
    };

    if (!createMode && !id) {
        return (
            <section className="space-y-4 rounded border bg-white p-6">
                <h1 className="text-3xl font-bold">SCR-003 プロジェクト詳細</h1>
                <p role="alert">
                    対象IDが指定されていません。プロジェクト一覧から選択してください。
                </p>
                <Link className="text-blue-700 underline" to={returnTo}>
                    プロジェクト一覧へ戻る
                </Link>
            </section>
        );
    }

    if (loading) {
        return <p role="status">プロジェクトを読み込み中...</p>;
    }

    if (!createMode && !project) {
        return (
            <section className="space-y-4 rounded border bg-white p-6">
                <h1 className="text-3xl font-bold">SCR-003 プロジェクト詳細</h1>
                <p className="text-red-800" role="alert">{currentLoadError}</p>
                <button
                    className="text-blue-700 underline"
                    onClick={() => setRetry((value) => value + 1)}
                    type="button"
                >
                    再試行
                </button>
                <Link className="text-blue-700 underline" to={returnTo}>
                    プロジェクト一覧へ戻る
                </Link>
            </section>
        );
    }

    return (
        <div
            className="
      bg-white
      border
      rounded
      p-6
      "
        >
            <h1
                className="
        text-3xl
        font-bold
        mb-4
        "
            >
                SCR-003 プロジェクト詳細
            </h1>

            <p>
                <Link
                    className="text-blue-700 underline"
                    to={`/tasks?projectId=${encodeURIComponent(item.id)}`}
                >
                    関連タスク一覧へ ({item.taskCount}件)
                </Link>
            </p>
            <pre>{JSON.stringify(item, null, 2)}</pre>
        </div>
    );
};
