import { useState } from "react";
import { DocumentTable } from "../components/converter/DocumentTable";
import { SummaryPanel } from "../components/converter/SummaryPanel";
import { TaskTable } from "../components/converter/TaskTable";
import { convertMarkdown } from "../services/converterApi";
import type { ConverterResult } from "../types/ConverterResult";

export const ConverterPage = () => {
    const [markdown, setMarkdown] = useState(`
# 要件定義書

## 実装対象

- API実装
- Task一覧画面作成
- ConverterService実装
`);

    const [result, setResult] = useState<ConverterResult>();

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
        <div
            className="
      max-w-full
      space-y-6
      "
        >
            <h1
                className="
        text-3xl
        font-bold
        "
            >
                SCR-CONV-001 管理データ変換
            </h1>

            <SummaryPanel
                taskCount={result?.data.summary.taskCount ?? 0}
                documentCount={result?.data.summary.documentCount ?? 0}
            />

            <div
                className="
        grid
        grid-cols-2
        gap-6
        "
            >
                <section>
                    <h2
                        className="
            font-bold
            mb-2
            "
                    >
                        Markdown入力
                    </h2>

                    <textarea
                        value={markdown}
                        onChange={(event) => setMarkdown(event.target.value)}
                        className="
            w-full
            h-[600px]
            border
            rounded
            p-4
            font-mono
            "
                    />

                    <button
                        onClick={execute}
                        disabled={loading}
                        className="
            mt-4
            bg-blue-600
            text-white
            px-4
            py-2
            rounded
            "
                    >
                        {loading ? "変換中..." : "管理データ変換"}
                    </button>
                </section>

                <section
                    className="
          space-y-6
          "
                >
                    <div>
                        <h2
                            className="
              font-bold
              mb-2
              "
                        >
                            Task一覧
                        </h2>

                        <TaskTable tasks={result?.data.tasks ?? []} />
                    </div>

                    <div>
                        <h2
                            className="
              font-bold
              mb-2
              "
                        >
                            Document一覧
                        </h2>

                        <DocumentTable
                            documents={result?.data.documents ?? []}
                        />
                    </div>

                    {result && (
                        <div
                            className="
                border
                rounded
                p-4
                text-sm
                "
                        >
                            <div>
                                tasks:
                                {result.data.output.tasksFile}
                            </div>

                            <div>
                                documents:
                                {result.data.output.documentsFile}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
