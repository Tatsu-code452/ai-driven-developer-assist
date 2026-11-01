import { useState } from "react";

import { DocumentTable } from "../components/converter/DocumentTable";
import { SummaryPanel } from "../components/converter/SummaryPanel";
import { TaskTable } from "../components/converter/TaskTable";

import { convertMarkdown } from "../services/converterApi";

import type { ConverterResult } from "../types/ConverterResult";

export const ConverterPage = () => {

  const [markdown, setMarkdown] =
    useState(`
# 要件定義書

## 実装対象

- API実装
- Task一覧画面作成
- ConverterService実装
`);

  const [result, setResult] =
    useState<ConverterResult>();

  const [loading, setLoading] =
    useState(false);

  const [fileName, setFileName] =
    useState("");

  const execute = async () => {

    try {

      setLoading(true);

      const response =
        await convertMarkdown(
          markdown
        );

      setResult(response);

    } finally {

      setLoading(false);

    }

  };

  const uploadMarkdownFile =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setFileName(
        file.name
      );

      const text =
        await file.text();

      setMarkdown(
        text
      );

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
        SCR-CONV-001
        管理データ変換
      </h1>

      <SummaryPanel
        taskCount={
          result?.data.summary.taskCount ?? 0
        }
        documentCount={
          result?.data.summary.documentCount ?? 0
        }
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

          <div
            className="
            mb-4
            border
            rounded
            bg-white
            p-4
            "
          >

            <label
              className="
              block
              text-sm
              font-semibold
              mb-2
              "
            >
              Markdownファイル読込
            </label>

            <input
              type="file"
              accept=".md,.markdown,.txt"
              onChange={
                uploadMarkdownFile
              }
              className="
              w-full
              "
            />

            {
              fileName && (

                <div
                  className="
                  mt-2
                  text-xs
                  text-slate-600
                  "
                >
                  読込ファイル:
                  {fileName}
                </div>

              )
            }

          </div>

          <textarea
            value={markdown}
            onChange={
              event =>
                setMarkdown(
                  event.target.value
                )
            }
            className="
            w-full
            h-[500px]
            border
            rounded
            p-4
            font-mono
            "
          />

          <div
            className="
            flex
            gap-2
            mt-4
            "
          >

            <button
              onClick={execute}
              disabled={loading}
              className="
              bg-blue-600
              text-white
              px-4
              py-2
              rounded
              "
            >
              {
                loading
                  ? "変換中..."
                  : "管理データ変換"
              }
            </button>

          </div>

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

            <TaskTable
              tasks={
                result?.data.tasks ?? []
              }
            />

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
              documents={
                result?.data.documents ?? []
              }
            />

          </div>

          {
            result && (

              <div
                className="
                border
                rounded
                p-4
                bg-white
                text-sm
                "
              >

                <div>

                  taskCount :
                  {
                    result.data.summary.taskCount
                  }

                </div>

                <div>

                  documentCount :
                  {
                    result.data.summary.documentCount
                  }

                </div>

                <hr
                  className="
                  my-2
                  "
                />

                <div>

                  tasks :
                  {
                    result.data.output.tasksFile
                  }

                </div>

                <div>

                  documents :
                  {
                    result.data.output.documentsFile
                  }

                </div>

              </div>

            )
          }

        </section>

      </div>

    </div>

  );

};
