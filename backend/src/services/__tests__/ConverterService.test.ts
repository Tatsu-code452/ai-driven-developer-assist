import fs from "fs";
import path from "path";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  convertMarkdownFile
} from "../ConverterService";

describe(
  "ConverterService",
  () => {

    it(
      "Markdownから管理データ生成",
      () => {

        const baseDir =
          ".test-converter";

        fs.mkdirSync(
          baseDir,
          {
            recursive:true
          }
        );

        const markdownFile =
          path.join(
            baseDir,
            "sample.md"
          );

        fs.writeFileSync(
          markdownFile,
`
# 要件定義書

- API実装
- 画面作成
`
        );

        const result =
          convertMarkdownFile(
            markdownFile,
            baseDir
          );

        expect(
          result.documentCount
        )
          .toBe(1);

        expect(
          result.taskCount
        )
          .toBe(2);

      }
    );

  }
);
