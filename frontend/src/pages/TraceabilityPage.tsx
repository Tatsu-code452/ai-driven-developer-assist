import { useEffect, useState } from "react";

import { fetchTraceability } from "../services/traceabilityApi";
import type { TraceabilityItem } from "../types/Api";

export const TraceabilityPage = () => {
    const [items, setItems] = useState<TraceabilityItem[]>([]);

    useEffect(() => {
        fetchTraceability().then((result) => setItems(result.items));
    }, []);

    return (
        <div>
            <h1>SCR-015 トレーサビリティ管理</h1>

            <table>
                <thead>
                    <tr>
                        <th>Source</th>

                        <th>Target</th>

                        <th>Relation</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item) => (
                        <tr key={item.sourceId + item.targetId}>
                            <td>{item.sourceId}</td>

                            <td>{item.targetId}</td>

                            <td>{item.relationType}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
