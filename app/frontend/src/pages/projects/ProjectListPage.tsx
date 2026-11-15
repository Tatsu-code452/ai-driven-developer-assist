import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { setCurrentProject } from "../../api/projectApi";

import { Link, proportional, type TableColumn } from "@astryxdesign/core";
import TablePaginatedTable from "../../components/TablePaginatedTable";
import { useProjects } from "../../hooks/useProjects";
import type { Project } from "../../types/Project";

export const ProjectListPage = () => {
    const navigate = useNavigate();

    const { projects, loading } = useProjects();

    const [keyword, setKeyword] = useState("");

    const [status, setStatus] = useState("");

    const filtered = useMemo(() => {
        return projects.filter((p) => {
            const nameMatch = p.name
                .toLowerCase()
                .includes(keyword.toLowerCase());

            const statusMatch = !status || p.status === status;

            return nameMatch && statusMatch;
        });
    }, [keyword, status, projects]);

    const handleSelect = async (id: string) => {
        await setCurrentProject(id);

        navigate(`/projects/${id}`);
    };

    if (loading) {
        return <div>loading...</div>;
    }

    const link = (item: Project, text: string) => {
        return (
            <Link
                href="#"
                children={text}
                hasUnderline
                color="primary"
                onClick={() => handleSelect(item.id)}
            />
        );
    };

    const columns: TableColumn<Project>[] = [
        {
            key: "id",
            header: "ID",
            width: proportional(1),
            renderCell: (item: Project) => link(item, item.id),
        },
        {
            key: "name",
            header: "名称",
            width: proportional(1),
            renderCell: (item: Project) => link(item, item.name),
        },
        { key: "status", header: "状態", width: proportional(1) },
        { key: "description", header: "概要", width: proportional(2) },
        { key: "rootPath", header: "RootPath", width: proportional(2) },
    ];

    return (
        <div
            style={{
                padding: 24,
            }}
        >
            <h1>プロジェクト一覧</h1>

            <div>
                <input
                    placeholder="名称"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">ALL</option>

                    <option value="PLANNING">PLANNING</option>

                    <option value="ACTIVE">ACTIVE</option>

                    <option value="SUSPENDED">SUSPENDED</option>

                    <option value="COMPLETED">COMPLETED</option>

                    <option value="ARCHIVED">ARCHIVED</option>
                </select>

                <button onClick={() => navigate("/projects/new")}>
                    新規作成
                </button>
            </div>

            <TablePaginatedTable columns={columns} rawData={filtered} />
        </div>
    );
};
