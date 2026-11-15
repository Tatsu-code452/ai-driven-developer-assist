import { useEffect, useState } from "react";

import axios from "axios";

export const DashboardPage = () => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        axios
            .get("http://localhost:3000/api/projects")
            .then((r) => setCount(r.data.totalCount));
    }, []);

    return (
        <div
            style={{
                padding: 24,
            }}
        >
            <h1>Dashboard</h1>

            <h3>Project Count</h3>

            <div>{count}</div>
        </div>
    );
};
