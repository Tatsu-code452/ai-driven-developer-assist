import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useProject } from "../contexts/ProjectContext";
import { apiErrorMessage } from "../services/api";
import { fetchProjects } from "../services/projectApi";
import { createTask, fetchTask, updateTask } from "../services/taskApi";
import type {
    Project,
    Task,
    TaskInput,
    TaskPriority,
    TaskStatus,
} from "../types/Api";

const emptyTask: TaskInput = {
    title: "",
    description: "",
    status: "TODO",
    priority: "NORMAL",
    projectId: "",
};

const listLocationFrom = (value: string | null) =>
    value && /^\/tasks(?:\?|$)/.test(value) ? value : "/tasks";

const transitions: Record<TaskStatus, TaskStatus[]> = {
    TODO: ["TODO", "DOING"],
    DOING: ["DOING", "DONE"],
    DONE: ["DONE", "DOING"],
};

const statuses: TaskStatus[] = ["TODO", "DOING", "DONE"];
const priorities: TaskPriority[] = ["LOW", "NORMAL", "HIGH"];
const noProjects: Project[] = [];

const formFromTask = (task: Task): TaskInput => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    projectId: task.projectId || "",
});

export const TaskDetailPage = () => {
    const { project } = useProject();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = searchParams.get("id");
    const createMode = searchParams.get("mode") === "create";
    const editMode = createMode || searchParams.get("mode") === "edit";
    const returnTo = listLocationFrom(searchParams.get("returnTo"));
    const formKey = createMode ? "create" : id || "missing";
    const [loadedTask, setLoadedTask] = useState<{
        id: string;
        value: Task;
    }>();
    const [formState, setFormState] = useState<{
        key: string;
        value: TaskInput;
    }>({ key: "", value: emptyTask });
    const form = formState.key === formKey ? formState.value : emptyTask;
    const [retry, setRetry] = useState(0);
    const [projectRetry, setProjectRetry] = useState(0);
    const [projectState, setProjectState] = useState<{
        retry: number;
        items: Project[];
        error: string;
    }>({ retry: -1, items: [], error: "" });
    const currentProjectState =
        projectState.retry === projectRetry ? projectState : undefined;
    const projects = currentProjectState?.items || noProjects;
    const projectError = currentProjectState?.error || "";
    const [loadError, setLoadError] = useState<{
        key: string;
        message: string;
    }>();
    const [saveError, setSaveError] = useState("");
    const [saving, setSaving] = useState(false);
    const task = loadedTask?.id === id ? loadedTask.value : undefined;
    const requestKey = `${createMode ? "create" : id || "missing"}:${retry}`;
    const currentLoadError =
        loadError?.key === requestKey ? loadError.message : "";
    const loading =
        !createMode && !!id && loadedTask?.id !== id && !currentLoadError;

    useEffect(() => {
        let active = true;
        if (createMode || !id) {
            return () => {
                active = false;
            };
        }

        fetchTask(id)
            .then((result) => {
                if (!active) return;
                setLoadedTask({ id, value: result });
                setFormState({ key: id, value: formFromTask(result) });
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setLoadError({
                    key: requestKey,
                    message: apiErrorMessage(
                        cause,
                        "タスクを読み込めませんでした",
                    ),
                });
            });

        return () => {
            active = false;
        };
    }, [createMode, id, requestKey]);

    useEffect(() => {
        let active = true;
        fetchProjects({ q: "", status: "", page: 1 })
            .then((result) => {
                if (active) {
                    setProjectState({
                        retry: projectRetry,
                        items: result.items,
                        error: "",
                    });
                }
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setProjectState({
                    retry: projectRetry,
                    items: [],
                    error: apiErrorMessage(
                        cause,
                        "プロジェクト一覧を読み込めませんでした",
                    ),
                });
            });

        return () => {
            active = false;
        };
    }, [projectRetry]);

    const originalForm = task ? formFromTask(task) : emptyTask;
    const dirty =
        editMode && JSON.stringify(form) !== JSON.stringify(originalForm);

    useEffect(() => {
        if (!dirty) return;
        const warnBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warnBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", warnBeforeUnload);
    }, [dirty]);

    const updateForm = (updates: Partial<TaskInput>) => {
        setFormState({
            key: formKey,
            value: { ...form, ...updates },
        });
        setSaveError("");
    };

    const returnToList = () => {
        if (dirty && !window.confirm("未保存の変更を破棄しますか？")) return;
        navigate(returnTo);
    };

    const cancelEdit = () => {
        if (dirty && !window.confirm("未保存の変更を破棄しますか？")) return;
        if (createMode) {
            navigate(returnTo);
            return;
        }

        const next = new URLSearchParams(searchParams);
        next.delete("mode");
        setSearchParams(next);
        if (task) {
            setFormState({ key: task.id, value: formFromTask(task) });
        }
    };

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.title.trim()) {
            setSaveError("タイトルを入力してください。");
            return;
        }
        if (!form.projectId) {
            setSaveError("プロジェクトを選択してください。");
            return;
        }
        if (!createMode && !id) {
            setSaveError(
                "対象IDが指定されていません。タスク一覧から選択してください。",
            );
            return;
        }
        if (
            !createMode &&
            task &&
            !transitions[task.status].includes(form.status)
        ) {
            setSaveError("許可されていない状態遷移です。");
            return;
        }

        setSaving(true);
        setSaveError("");
        const input = {
            ...form,
            title: form.title.trim(),
        };

        try {
            let saved: Task;
            if (createMode) {
                saved = await createTask({ ...input, status: "TODO" });
            } else if (id) {
                saved = await updateTask(id, input);
            } else {
                return;
            }

            setLoadedTask({ id: saved.id, value: saved });
            setFormState({
                key: saved.id,
                value: formFromTask(saved),
            });
            const next = new URLSearchParams(searchParams);
            next.set("id", saved.id);
            next.delete("mode");
            next.set("returnTo", returnTo);
            setSearchParams(next);
        } catch (cause: unknown) {
            setSaveError(
                apiErrorMessage(cause, "タスクを保存できませんでした"),
            );
        } finally {
            setSaving(false);
        }
    };

    if (!createMode && !id) {
        return (
            <section className="space-y-4 rounded border bg-white p-6">
                <h1 className="text-3xl font-bold">SCR-022 タスク詳細</h1>
                <p role="alert">
                    対象IDが指定されていません。タスク一覧から選択してください。
                </p>
                <Link className="text-blue-700 underline" to={returnTo}>
                    タスク一覧へ戻る
                </Link>
            </section>
        );
    }

    if (loading) {
        return <p role="status">タスクを読み込み中...</p>;
    }

    if (!createMode && !task) {
        return (
            <section className="space-y-4 rounded border bg-white p-6">
                <h1 className="text-3xl font-bold">SCR-022 タスク詳細</h1>
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
                <button
                    className="text-blue-700 underline"
                    onClick={returnToList}
                    type="button"
                >
                    タスク一覧へ戻る
                </button>
            </section>
        );
    }

    const projectName = (projectId?: string) =>
        projectId
            ? projects.find((project) => project.id === projectId)?.name ||
              projectId
            : "プロジェクト未設定";
    const allowedStatuses: TaskStatus[] = createMode
        ? ["TODO"]
        : task
          ? transitions[task.status]
          : statuses;

    return (
        <section className="mx-auto max-w-3xl space-y-4">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">SCR-022 タスク詳細</h1>
                {task && !editMode && (
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

            {(saveError || projectError) && (
                <div className="space-y-2" role="alert">
                    {saveError && <p className="text-red-800">{saveError}</p>}
                    {projectError && (
                        <div className="flex items-center gap-3">
                            <p className="text-red-800">{projectError}</p>
                            <button
                                className="text-blue-700 underline"
                                onClick={() =>
                                    setProjectRetry((value) => value + 1)
                                }
                                type="button"
                            >
                                プロジェクトを再読み込み
                            </button>
                        </div>
                    )}
                </div>
            )}

            {editMode ? (
                <form
                    className="space-y-4 rounded border bg-white p-6"
                    onSubmit={save}
                >
                    {task && (
                        <p>
                            <span className="font-semibold">ID:</span> {task.id}
                            <span className="ml-2 text-slate-600">
                                （変更不可）
                            </span>
                        </p>
                    )}
                    <label className="block space-y-1">
                        <span className="font-semibold">タイトル *</span>
                        <input
                            autoFocus
                            className="w-full rounded border px-3 py-2"
                            disabled={saving}
                            maxLength={200}
                            onChange={(event) =>
                                updateForm({ title: event.target.value })
                            }
                            required
                            value={form.title}
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="font-semibold">説明</span>
                        <textarea
                            className="min-h-32 w-full rounded border px-3 py-2"
                            disabled={saving}
                            onChange={(event) =>
                                updateForm({ description: event.target.value })
                            }
                            value={form.description}
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="font-semibold">プロジェクト *</span>
                        <select
                            className="w-full rounded border px-3 py-2"
                            disabled={saving}
                            onChange={(event) =>
                                updateForm({ projectId: event.target.value })
                            }
                            required
                            value={form.projectId}
                        >
                            <option value="">選択してください</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project?.name} ({project.id})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block space-y-1">
                        <span className="font-semibold">状態</span>
                        <select
                            className="w-full rounded border px-3 py-2"
                            disabled={saving || createMode}
                            onChange={(event) => {
                                const status = statuses.find(
                                    (value) => value === event.target.value,
                                );
                                if (status) updateForm({ status });
                            }}
                            value={form.status}
                        >
                            {allowedStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block space-y-1">
                        <span className="font-semibold">優先度</span>
                        <select
                            className="w-full rounded border px-3 py-2"
                            disabled={saving}
                            onChange={(event) => {
                                const priority = priorities.find(
                                    (value) => value === event.target.value,
                                );
                                if (priority) updateForm({ priority });
                            }}
                            value={form.priority}
                        >
                            {priorities.map((priority) => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>
                    </label>
                    <p>
                        <span className="font-semibold">出典:</span>{" "}
                        {task?.source || "手動登録"}（変更不可）
                    </p>
                    <div className="flex gap-3">
                        <button
                            className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
                            disabled={saving || !!projectError}
                            type="submit"
                        >
                            {saving ? "保存中..." : "保存"}
                        </button>
                        <button
                            className="rounded border px-4 py-2 disabled:opacity-50"
                            disabled={saving}
                            onClick={cancelEdit}
                            type="button"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            ) : task ? (
                <div className="space-y-5 rounded border bg-white p-6">
                    <dl className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                        <dt className="font-semibold">ID</dt>
                        <dd>{task.id}</dd>
                        <dt className="font-semibold">タイトル</dt>
                        <dd>{task.title}</dd>
                        <dt className="font-semibold">説明</dt>
                        <dd className="whitespace-pre-wrap">
                            {task.description || "—"}
                        </dd>
                        <dt className="font-semibold">プロジェクト</dt>
                        <dd>{projectName(task.projectId)}</dd>
                        <dt className="font-semibold">状態</dt>
                        <dd>{task.status}</dd>
                        <dt className="font-semibold">優先度</dt>
                        <dd>{task.priority}</dd>
                        <dt className="font-semibold">出典</dt>
                        <dd>{task.source}</dd>
                    </dl>
                    <button
                        className="text-blue-700 underline"
                        onClick={returnToList}
                        type="button"
                    >
                        一覧へ戻る
                    </button>
                </div>
            ) : null}
        </section>
    );
};
