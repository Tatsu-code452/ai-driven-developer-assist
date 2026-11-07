import {
  describe,
  expect,
  it
} from "vitest";

import {
  mkdtempSync,
  rmSync
} from "node:fs";
import path from "node:path";

import {
  convertMarkdown
} from "../ConverterService";

const convertMarkdownInTemporaryDirectory = (
  markdown: string
) => {
  const outputRoot =
    mkdtempSync(
      path.join(
        process.cwd(),
        "data",
        ".converter-test-"
      )
    );

  try {
    return convertMarkdown(
      markdown,
      outputRoot
    );
  } finally {
    rmSync(
      outputRoot,
      {
        recursive: true,
        force: true
      }
    );
  }
};

describe(
  "ConverterService",
  () => {

    it(
      "markdownを管理データへ変換",
      () => {

        const result =
          convertMarkdownInTemporaryDirectory(
`
# 要件定義書

- API実装
- 画面作成
- テスト対応
`
          );

        expect(
          result.summary
            .taskCount
        )
          .toBe(3);

        expect(
          result.summary
            .documentCount
        )
          .toBe(1);

      }
    );

    it(
      "生成Taskを返却",
      () => {

        const result =
          convertMarkdownInTemporaryDirectory(
`
# WBS

- API実装
`
          );

        expect(
          result.tasks[0]
            .id
        )
          .toBe(
            "TSK-001"
          );

      }
    );

    it(
      "Documentを返却",
      () => {

        const result =
          convertMarkdownInTemporaryDirectory(
`
# 要件定義書
`
          );

        expect(
          result.documents[0]
            .id
        )
          .toBe(
            "REQ-001"
          );

      }
    );

  }
);
