import { useEffect, useState } from "react";

import { apiErrorMessage } from "../../services/api";
import { fetchProjectManagementData } from "../../services/projectApi";
import type { ManagementDataIndex } from "../../types/Api";

type Props = {
    projectId: string;
    rootPath: string;
};

export const ManagementDataList = ({ projectId, rootPath }: Props) => {
    const [retry, setRetry] = useState(0);
    const [loaded, setLoaded] = useState<{
        key: string;
        value: ManagementDataIndex;
    }>();
    const [failed, setFailed] = useState<{
        key: string;
        message: string;
    }>();
    // 保存で管理データパスが変わった場合も再取得する
    const requestKey = `${projectId}:${rootPath}:${retry}`;
    const index = loaded?.key === requestKey ? loaded.value : undefined;
    const errorMessage =
        failed?.key === requestKey ? failed.message : "";

    useEffect(() => {
        let active = true;

        fetchProjectManagementData(projectId)
            .then((result) => {
                if (active) setLoaded({ key: requestKey, value: result });
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setFailed({
                    key: requestKey,
                    message: apiErrorMessage(
                        cause,
                        "管理データ一覧を読み込めませんでした",
                    ),
                });
            });

        return () => {
            active = false;
        };
    }, [projectId, requestKey]);

    return (
        <section aria-labelledby="management-data-heading" className="space-y-2">
            <h2 className="text-xl font-bold" id="management-data-heading">
                管理データ一覧
            </h2>

            {!index && !errorMessage && (
                <p role="status">管理データ一覧を読み込み中...</p>
            )}

            {errorMessage && (
                <div className="space-y-2">
                    <p className="text-red-800" role="alert">
                        {errorMessage}
                    </p>
                    <button
                        className="text-blue-700 underline"
                        onClick={() => setRetry((value) => value + 1)}
                        type="button"
                    >
                        再試行
                    </button>
                </div>
            )}

            {index && index.status !== "ok" && (
                <p
                    className="rounded border border-amber-300 bg-amber-50 p-3"
                    role="status"
                >
                    {index.message}
                </p>
            )}

            {index && index.status === "ok" && index.items.length === 0 && (
                <p>管理データ一覧にリンクが登録されていません。</p>
            )}

            {index && index.status === "ok" && index.items.length > 0 && (
                <table className="w-full border-collapse text-left">
                    <caption className="sr-only">
                        管理データパス配下の管理データ一覧
                    </caption>
                    <thead>
                        <tr className="border-b">
                            <th className="py-1 pr-3" scope="col">
                                名称
                            </th>
                            <th className="py-1 pr-3" scope="col">
                                パス
                            </th>
                            <th className="py-1" scope="col">
                                状態
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {index.items.map((item) => (
                            <tr className="border-b" key={item.path}>
                                <td className="py-1 pr-3">{item.title}</td>
                                <td className="py-1 pr-3 break-all">
                                    {item.path}
                                </td>
                                <td
                                    className={
                                        item.exists
                                            ? "py-1"
                                            : "py-1 text-red-800"
                                    }
                                >
                                    {item.exists ? "あり" : "ファイルなし"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
};
