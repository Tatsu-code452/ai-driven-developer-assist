import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiErrorMessage } from "../services/api";
import { fetchProjects } from "../services/projectApi";
import { fetchTasks } from "../services/taskApi";
import type {
    Project,
    TaskListFilters,
    TaskPriority,
    TaskStatus,
} from "../types/Api";

const statuses: TaskStatus[] = ["TODO", "DOING", "DONE"];
const priorities: TaskPriority[] = ["LOW", "NORMAL", "HIGH"];
const noProjects: Project[] = [];

const selectedOption = <T extends string>(
    value: string | null,
    options: T[],
): T | undefined => options.find((option) => option === value);

const parsePage = (value: string | null) => {
    return value === null ? 1 : Number(value);
};

export const TaskListPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchKey = searchParams.toString();
    const filters = useMemo<TaskListFilters>(() => {
        const params = new URLSearchParams(searchKey);
        const projectId = params.get("projectId") || undefined;
        return {
            q: params.get("q") || "",
            projectId,
            status: params.get("status") || undefined,
            priority: params.get("priority") || undefined,
            page: parsePage(params.get("page")),
        };
    }, [searchKey]);
    const [draftState, setDraftState] = useState<{
        key: string;
        value: TaskListFilters;
    }>({ key: "", value: filters });
    const draft =
        draftState.key === searchKey ? draftState.value : filters;
    const setDraft = (updates: Partial<TaskListFilters>) => {
        setDraftState({
            key: searchKey,
            value: { ...draft, ...updates },
        });
    };
    const [retry, setRetry] = useState(0);
    const [projectRetry, setProjectRetry] = useState(0);
    const requestKey = `${searchKey}:${retry}`;
    const [taskState, setTaskState] = useState<{
        key: string;
        result?: Awaited<ReturnType<typeof fetchTasks>>;
        error: string;
    }>({ key: "", error: "" });
    const currentTaskState =
        taskState.key === requestKey ? taskState : undefined;
    const items = currentTaskState?.result?.items || [];
    const count = currentTaskState?.result?.count || 0;
    const page = currentTaskState?.result?.page || filters.page || 1;
    const totalPages = currentTaskState?.result?.totalPages || 1;
    const listError = currentTaskState?.error || "";
    const loading = !currentTaskState;
    const [projectState, setProjectState] = useState<{
        retry: number;
        items: Project[];
        error: string;
    }>({ retry: -1, items: [], error: "" });
    const currentProjectState =
        projectState.retry === projectRetry ? projectState : undefined;
    const projects = currentProjectState?.items || noProjects;
    const projectError = currentProjectState?.error || "";

    useEffect(() => {
        let active = true;

        fetchTasks(filters)
            .then((result) => {
                if (!active) return;
                setTaskState({ key: requestKey, result, error: "" });
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setTaskState({
                    key: requestKey,
                    error: apiErrorMessage(
                        cause,
                        "タスク一覧を読み込めませんでした",
                    ),
                });
            });

        return () => {
            active = false;
        };
    }, [filters, requestKey]);

    useEffect(() => {
        let active = true;
        fetchProjects()
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

    const returnTo = searchKey ? `/tasks?${searchKey}` : "/tasks";
    const createParams = new URLSearchParams({
        mode: "create",
        returnTo,
    });

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const next = new URLSearchParams();
        const q = draft.q?.trim();
        if (q) next.set("q", q);
        if (draft.projectId) next.set("projectId", draft.projectId);
        if (draft.status) next.set("status", draft.status);
        if (draft.priority) next.set("priority", draft.priority);
        setSearchParams(next);
    };

    const changePage = (nextPage: number) => {
        const next = new URLSearchParams(searchParams);
        if (nextPage === 1) {
            next.delete("page");
        } else {
            next.set("page", String(nextPage));
        }
        setSearchParams(next);
    };

    const projectNames = useMemo(
        () => new Map(projects.map((project) => [project.id, project.name])),
        [projects],
    );

    return (
        <section className="space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-bold">SCR-021 タスク一覧</h1>
                <Link
                    className="rounded bg-blue-700 px-4 py-2 text-white"
                    to={`/tasks/detail?${createParams.toString()}`}
                >
                    新規タスク
                </Link>
            </header>

            {projectError && (
                <div className="flex items-center gap-3" role="alert">
                    <p className="text-red-800">{projectError}</p>
                    <button
                        className="text-blue-700 underline"
                        onClick={() => setProjectRetry((value) => value + 1)}
                        type="button"
                    >
                        プロジェクトを再読み込み
                    </button>
                </div>
            )}

            <form
                className="grid gap-3 rounded border bg-white p-4 md:grid-cols-5"
                onSubmit={applyFilters}
            >
                <label className="space-y-1">
                    <span className="block font-semibold">キーワード</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        onChange={(event) =>
                            setDraft({ q: event.target.value })
                        }
                        value={draft.q || ""}
                    />
                </label>
                <label className="space-y-1">
                    <span className="block font-semibold">プロジェクト</span>
                    <select
                        className="w-full rounded border px-3 py-2"
                        onChange={(event) =>
                            setDraft({
                                projectId: event.target.value || undefined,
                            })
                        }
                        value={draft.projectId || ""}
                    >
                        <option value="">すべて</option>
                        <option value="unassigned">プロジェクト未設定</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name} ({project.id})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="block font-semibold">状態</span>
                    <select
                        className="w-full rounded border px-3 py-2"
                        onChange={(event) =>
                            setDraft({
                                status: selectedOption(
                                    event.target.value,
                                    statuses,
                                ),
                            })
                        }
                        value={draft.status || ""}
                    >
                        <option value="">すべて</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="block font-semibold">優先度</span>
                    <select
                        className="w-full rounded border px-3 py-2"
                        onChange={(event) =>
                            setDraft({
                                priority: selectedOption(
                                    event.target.value,
                                    priorities,
                                ),
                            })
                        }
                        value={draft.priority || ""}
                    >
                        <option value="">すべて</option>
                        {priorities.map((priority) => (
                            <option key={priority} value={priority}>
                                {priority}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="flex items-end gap-2">
                    <button
                        className="rounded bg-slate-800 px-4 py-2 text-white"
                        type="submit"
                    >
                        検索
                    </button>
                    <button
                        className="rounded border px-4 py-2"
                        onClick={() => {
                            setDraft({
                                q: "",
                                projectId: undefined,
                                status: undefined,
                                priority: undefined,
                            });
                            setSearchParams({});
                        }}
                        type="button"
                    >
                        クリア
                    </button>
                </div>
            </form>

            {listError && (
                <div className="flex items-center gap-3" role="alert">
                    <p className="text-red-800">{listError}</p>
                    <button
                        className="text-blue-700 underline"
                        onClick={() => setRetry((value) => value + 1)}
                        type="button"
                    >
                        再試行
                    </button>
                </div>
            )}

            {loading ? (
                <p role="status">タスク一覧を読み込み中...</p>
            ) : !listError && (
                <>
                    <p aria-live="polite">
                        {count}件 / {page} / {totalPages}ページ
                    </p>
                    {items.length === 0 ? (
                        <p className="rounded border bg-white p-6">
                            該当するデータがありません。
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded border bg-white">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b bg-slate-50">
                                        <th className="p-3">ID</th>
                                        <th className="p-3">タイトル</th>
                                        <th className="p-3">プロジェクト</th>
                                        <th className="p-3">状態</th>
                                        <th className="p-3">優先度</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => {
                                        const detailParams =
                                            new URLSearchParams({
                                                id: item.id,
                                                returnTo,
                                            });
                                        return (
                                            <tr
                                                className="border-b last:border-0"
                                                key={item.id}
                                            >
                                                <td className="p-3">
                                                    <Link
                                                        className="text-blue-700 underline"
                                                        to={`/tasks/detail?${detailParams.toString()}`}
                                                    >
                                                        {item.id}
                                                    </Link>
                                                </td>
                                                <td className="p-3">
                                                    {item.title}
                                                </td>
                                                <td className="p-3">
                                                    {item.projectId
                                                        ? projectNames.get(
                                                              item.projectId,
                                                          ) || item.projectId
                                                        : "プロジェクト未設定"}
                                                </td>
                                                <td className="p-3">
                                                    {item.status}
                                                </td>
                                                <td className="p-3">
                                                    {item.priority}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <nav
                        aria-label="ページ送り"
                        className="flex items-center justify-center gap-4"
                    >
                        <button
                            className="rounded border px-3 py-2 disabled:opacity-50"
                            disabled={page <= 1}
                            onClick={() => changePage(page - 1)}
                            type="button"
                        >
                            前へ
                        </button>
                        <span>
                            {page} / {totalPages}
                        </span>
                        <button
                            className="rounded border px-3 py-2 disabled:opacity-50"
                            disabled={page >= totalPages}
                            onClick={() => changePage(page + 1)}
                            type="button"
                        >
                            次へ
                        </button>
                    </nav>
                </>
            )}
        </section>
    );
};
