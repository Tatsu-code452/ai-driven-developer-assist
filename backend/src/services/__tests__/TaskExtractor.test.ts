import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseMarkdownContent
} from "../markdownParser/parseMarkdownContent";

import {
  extractTasks,
  hasTaskSection
} from "../TaskExtractor";

describe(
  "TaskExtractor",
  () => {

    it(
      "作成を含むリストをTaskへ変換",
      () => {

        const document =
          parseMarkdownContent(`
# WBS

- ダッシュボード作成
- API実装
- テスト対応
`);

        const tasks =
          extractTasks(
            document
          );

        expect(tasks)
          .toHaveLength(3);

        expect(
          tasks[0].id
        )
          .toBe(
            "TSK-001"
          );

      }
    );

    it(
      "重複タイトルは除外",
      () => {

        const document =
          parseMarkdownContent(`
# WBS

- API実装
- API実装
`);

        const tasks =
          extractTasks(
            document
          );

        expect(tasks)
          .toHaveLength(1);

      }
    );

    it(
      "タスク以外は除外",
      () => {

        const document =
          parseMarkdownContent(`
# Sample

- 概要説明
- システム概要
`);

        const tasks =
          extractTasks(
            document
          );

        expect(tasks)
          .toHaveLength(0);

      }
    );

    it(
      "タスクセクションを検知",
      () => {

        const document =
          parseMarkdownContent(`
# WBS

## タスク一覧
`);

        expect(
          hasTaskSection(
            document
          )
        )
          .toBe(
            true
          );

      }
    );

  }
);
