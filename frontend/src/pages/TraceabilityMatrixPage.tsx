import { useEffect, useState } from "react";

import { fetchMatrix } from "../services/matrixApi";

export const TraceabilityMatrixPage = () => {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        fetchMatrix().then((result) => setItems(result.items));
    }, []);

    return (
        <div>
            <h1>SCR-016 トレーサビリティマトリクス</h1>

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
                        <tr key={item.source + item.target}>
                            <td>{item.source}</td>

                            <td>{item.target}</td>

                            <td>{item.relation}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
