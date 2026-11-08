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
    rootPath: "",
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
    const requestKey = `${createMode ? "create" : (id ?? "missing")}:${retry}`;
    const currentLoadError =
        loadError?.key === requestKey ? loadError.message : "";
    const loading =
        !createMode && !!id && loadedProject?.id !== id && !currentLoadError;

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
                    rootPath: result.rootPath,
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
            rootPath: form.rootPath,
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
                rootPath: saved.rootPath,
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
                <p className="text-red-800" role="alert">
                    {currentLoadError}
                </p>
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
        <section className="mx-auto max-w-3xl space-y-4">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">SCR-003 プロジェクト詳細</h1>
                {project && !editMode && (
                    <button
                        className="rounded border px-4 py-2 hover:bg-slate-50"
                        onClick={() => {
                            const next = new URLSearchParams(searchParams);
                            next.set("mode", "edit");
                            setSearchParams(next);
                        }}
                        type="button"
                    >
                        編集
                    </button>
                )}
            </header>

            {(saveError || currentLoadError) && (
                <p className="text-red-800" role="alert">
                    {saveError || currentLoadError}
                </p>
            )}

            {editMode ? (
                <form
                    className="space-y-4 rounded border bg-white p-6"
                    onSubmit={save}
                >
                    {project && (
                        <p>
                            <span className="font-semibold">ID:</span>{" "}
                            {project.id}
                            <span className="ml-2 text-slate-600">
                                （変更不可）
                            </span>
                        </p>
                    )}
                    <label className="block space-y-1">
                        <span className="font-semibold">名称 *</span>
                        <input
                            autoFocus
                            className="w-full rounded border px-3 py-2"
                            disabled={saving}
                            maxLength={200}
                            onChange={(event) =>
                                setForm((value) => ({
                                    ...value,
                                    name: event.target.value,
                                }))
                            }
                            required
                            value={form.name}
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="font-semibold">説明</span>
                        <textarea
                            className="min-h-32 w-full rounded border px-3 py-2"
                            disabled={saving}
                            onChange={(event) =>
                                setForm((value) => ({
                                    ...value,
                                    description: event.target.value,
                                }))
                            }
                            value={form.description}
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="font-semibold">状態</span>
                        <input
                            className="w-full rounded border px-3 py-2"
                            disabled={saving}
                            onChange={(event) =>
                                setForm((value) => ({
                                    ...value,
                                    status: event.target.value,
                                }))
                            }
                            value={form.status}
                        />
                    </label>
                    <label
                        className="
  block
  space-y-1
  "
                    >
                        <span
                            className="
    font-semibold
    "
                        >
                            管理データパス
                        </span>

                        <input
                            className="
    w-full
    rounded
    border
    px-3
    py-2
    "
                            value={form.rootPath}
                            onChange={(event) =>
                                setForm((value) => ({
                                    ...value,
                                    rootPath: event.target.value,
                                }))
                            }
                        />
                    </label>
                    <div className="flex gap-3">
                        <button
                            className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
                            disabled={saving}
                            type="submit"
                        >
                            {saving ? "保存中..." : "保存"}
                        </button>
                        <button
                            className="rounded border px-4 py-2"
                            disabled={saving}
                            onClick={cancelEdit}
                            type="button"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            ) : project ? (
                <div className="space-y-5 rounded border bg-white p-6">
                    <dl className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                        <dt className="font-semibold">ID</dt>
                        <dd>{project.id}</dd>
                        <dt className="font-semibold">名称</dt>
                        <dd>{project.name}</dd>
                        <dt className="font-semibold">説明</dt>
                        <dd className="whitespace-pre-wrap">
                            {project.description || "—"}
                        </dd>
                        <dt className="font-semibold">状態</dt>
                        <dd>{project.status || "—"}</dd>
                        <dt
                            className="
  font-semibold
  "
                        >
                            管理データパス
                        </dt>
                        <dd>{project.rootPath}</dd>
                        <dt className="font-semibold">関連タスク</dt>
                        <dd>
                            <Link
                                className="text-blue-700 underline"
                                to={`/tasks?projectId=${encodeURIComponent(project.id)}`}
                            >
                                {project.taskCount}件
                            </Link>
                        </dd>
                        <dt className="font-semibold">関連成果物</dt>
                        <dd>{project.documentCount}件</dd>
                    </dl>
                    <Link
                        className="inline-block text-blue-700 underline"
                        to={returnTo}
                    >
                        一覧へ戻る
                    </Link>
                </div>
            ) : null}
        </section>
    );
};
