import { useState } from "react";
import { JsonViewer } from "../components/JsonViewer";
import { convertMarkdown } from "../services/converterApi";

const INIT_TEXT = `# Sample

## Overview

- Task A
- Task B
`;
export const ConverterPage = () => {
    const [markdown, setMarkdown] = useState(INIT_TEXT);
    const [result, setResult] = useState();
    const [loading, setLoading] = useState(false);

    const execute = async () => {
        try {
            setLoading(true);

            const response = await convertMarkdown(markdown);

            setResult(response);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto ">
            <h1 className="text-2xl font-bold mb-4 ">管理データ変換</h1>

            <div className="grid grid-cols-2 gap-4 ">
                <div>
                    <label className="block mb-2 font-semibold ">
                        Markdown
                    </label>

                    <textarea
                        value={markdown}
                        onChange={(event) => setMarkdown(event.target.value)}
                        className="w-full h-150 border rounded p-3 font-mono "
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2 ">
                        <label className="font-semibold ">Parse Result</label>

                        <button
                            onClick={execute}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded "
                        >
                            {loading ? "実行中..." : "変換"}
                        </button>
                    </div>

                    <JsonViewer data={result} />
                </div>
            </div>
        </div>
    );
};
