import {
  describe,
  expect,
  it
} from "vitest";

import {
  convertMarkdown
} from "../ConverterService";

describe(
  "ConverterService",
  () => {

    it(
      "markdownを管理データへ変換",
      () => {

        const result =
          convertMarkdown(
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
          convertMarkdown(
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
          convertMarkdown(
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
