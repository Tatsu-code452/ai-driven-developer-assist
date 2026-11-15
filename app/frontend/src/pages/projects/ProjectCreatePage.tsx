import { useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

export const ProjectCreatePage = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");

    const [description, setDescription] = useState("");

    const [rootPath, setRootPath] = useState("");

    const save = async () => {
        await axios.post("http://localhost:3000/api/projects", {
            name,
            description,
            rootPath,
            status: "PLANNING",
        });

        navigate("/projects");
    };

    return (
        <div
            style={{
                padding: 24,
            }}
        >
            <h1>プロジェクト作成</h1>

            <input
                placeholder="名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <textarea
                placeholder="説明"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <input
                placeholder="rootPath"
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
            />

            <button onClick={save}>登録</button>
        </div>
    );
};
