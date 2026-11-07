import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";
import { fetchProjects } from "../services/projectApi";
import type { Project } from "../types/Api";

export const ProjectDetailPage = () => {
    const [searchParams] = useSearchParams();

    const id = searchParams.get("id");

    const [items, setItems] = useState<Project[]>([]);

    useEffect(() => {
        fetchProjects().then((result) => setItems(result.items));
    }, []);

    const item = useMemo(
        () => items.find((item) => item.id === id),
        [items, id],
    );

    if (!item) {
        return (
            <div
                className="
        bg-white
        border
        rounded
        p-6
        "
            >
                ドキュメントが見つかりません
            </div>
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

            <pre>{JSON.stringify(item, null, 2)}</pre>
        </div>
    );
};
