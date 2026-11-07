import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiErrorMessage } from "../services/api";
import { fetchProjects } from "../services/projectApi";
import type { Project } from "../types/Api";

export const ProjectListPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [items, setItems] = useState<Project[]>([]);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [loadedKey, setLoadedKey] = useState("");
    const [loadError, setLoadError] = useState<{ key: string; message: string }>();
    const [retry, setRetry] = useState(0);

    const currentQuery = searchParams.toString();
    const pageValue = Number(searchParams.get("page") ?? "1");
    const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const requestKey = `${currentQuery}:${retry}`;
    const loading = loadedKey !== requestKey && loadError?.key !== requestKey;
    const error = loadError?.key === requestKey ? loadError.message : "";
    const visibleItems = loadedKey === requestKey ? items : [];

    useEffect(() => {
        let active = true;

        fetchProjects({
            q: new URLSearchParams(currentQuery).get("q") ?? "",
            status: new URLSearchParams(currentQuery).get("status") ?? "",
            page,
        })
            .then((result) => {
                if (!active) return;
                setItems(result.items);
                setTotal(result.total);
                setPageSize(result.pageSize);
                setLoadedKey(requestKey);
                setLoadError(undefined);
                if (result.page !== page) {
                    const next = new URLSearchParams(currentQuery);
                    if (result.page === 1) next.delete("page");
                    else next.set("page", String(result.page));
                    setSearchParams(next);
                }
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setLoadError({
                    key: requestKey,
                    message: apiErrorMessage(
                        cause,
                        "プロジェクト一覧を読み込めませんでした",
                    ),
                });
            });

        return () => {
            active = false;
        };
    }, [currentQuery, page, requestKey, setSearchParams]);

    const updateFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const next = new URLSearchParams(searchParams);
        const keyword = String(values.get("q") ?? "").trim();
        const status = String(values.get("status") ?? "").trim();
        if (keyword) next.set("q", keyword);
        else next.delete("q");
        if (status) next.set("status", status);
        else next.delete("status");
        next.delete("page");
        setSearchParams(next);
    };

    const goToPage = (nextPage: number) => {
        const next = new URLSearchParams(searchParams);
        if (nextPage === 1) next.delete("page");
        else next.set("page", String(nextPage));
        setSearchParams(next);
    };

    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const returnTo = `/projects?${currentQuery}`;
    const createUrl = `/projects/detail?mode=create&returnTo=${encodeURIComponent(returnTo)}`;

    return (
        <section className="space-y-4">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">SCR-002 プロジェクト一覧</h1>
                <Link
                    className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
                    to={createUrl}
                >
                    新規プロジェクト
                </Link>
            </header>

            <form
                className="flex flex-wrap gap-3 rounded border bg-white p-4"
                key={currentQuery}
                onSubmit={updateFilters}
            >
                <label className="flex flex-col gap-1">
                    <span>名前・ID</span>
                    <input
                        className="rounded border px-3 py-2"
                        defaultValue={searchParams.get("q") ?? ""}
                        name="q"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span>状態</span>
                    <input
                        className="rounded border px-3 py-2"
                        defaultValue={searchParams.get("status") ?? ""}
                        name="status"
                    />
                </label>
                <button
                    className="self-end rounded border px-4 py-2 hover:bg-slate-100"
                    type="submit"
                >
                    検索
                </button>
            </form>

            {error && (
                <div
                    className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
                    role="alert"
                >
                    <p>{error}</p>
                    <button
                        className="mt-2 underline"
                        onClick={() => setRetry((value) => value + 1)}
                        type="button"
                    >
                        再試行
                    </button>
                </div>
            )}

            <div className="overflow-x-auto rounded border bg-white">
                <table className="w-full text-left">
                    <thead className="border-b bg-slate-50">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">名称</th>
                            <th className="p-3">状態</th>
                            <th className="p-3">関連タスク</th>
                            <th className="p-3">関連成果物</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td className="p-4" colSpan={5}>読み込み中...</td>
                            </tr>
                        )}
                        {!loading && !error && visibleItems.map((item) => {
                            const detailUrl =
                                `/projects/detail?id=${encodeURIComponent(item.id)}` +
                                `&returnTo=${encodeURIComponent(returnTo)}`;
                            return (
                                <tr className="border-b last:border-0" key={item.id}>
                                    <td className="p-3">
                                        <Link className="text-blue-700 underline" to={detailUrl}>
                                            {item.id}
                                        </Link>
                                    </td>
                                    <td className="p-3">
                                        <Link className="text-blue-700 underline" to={detailUrl}>
                                            {item.name}
                                        </Link>
                                    </td>
                                    <td className="p-3">{item.status || "—"}</td>
                                    <td className="p-3">{item.taskCount}</td>
                                    <td className="p-3">{item.documentCount}</td>
                                </tr>
                            );
                        })}
                        {!loading && !error && visibleItems.length === 0 && (
                            <tr>
                                <td className="p-4 text-slate-600" colSpan={5}>
                                    該当するプロジェクトがありません。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <nav aria-label="ページ送り" className="flex items-center justify-end gap-3">
                <span>{total}件 / {page} / {pageCount}ページ</span>
                <button
                    className="rounded border px-3 py-1 disabled:opacity-50"
                    disabled={page <= 1 || loading}
                    onClick={() => goToPage(page - 1)}
                    type="button"
                >
                    前へ
                </button>
                <button
                    className="rounded border px-3 py-1 disabled:opacity-50"
                    disabled={page >= pageCount || loading}
                    onClick={() => goToPage(page + 1)}
                    type="button"
                >
                    次へ
                </button>
            </nav>
        </section>
    );
};
