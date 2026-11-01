import { describe, expect, it } from "vitest";

import { parseMarkdownContent } from "@/services/markdownParser/parseMarkdownContent";
import { parseLists } from "@/services/markdownParser/parseMarkdownList";
import { parseTables } from "@/services/markdownParser/parseMarkdownTable";
import { extractTitle, parseHeadings } from "@/services/markdownParser/parseUtils";

describe("MarkdownParser", () => {

  describe("parseHeadings", () => {

    it("H1を解析できる", () => {

      const markdown = "# Title";

      const result =
        parseHeadings(markdown);

      expect(result).toHaveLength(1);

      expect(result[0]).toEqual({
        level: 1,
        text: "Title",
        lineNumber: 1
      });
    });

    it("複数階層の見出しを解析できる", () => {

      const markdown = `
# Root

## Child

### GrandChild
`;

      const result =
        parseHeadings(markdown);

      expect(result).toHaveLength(3);

      expect(result[0].level)
        .toBe(1);

      expect(result[1].level)
        .toBe(2);

      expect(result[2].level)
        .toBe(3);
    });

  });

  describe("extractTitle", () => {

    it("最初のH1をタイトルとして取得する", () => {

      const headings =
        parseHeadings(`
# Requirements

## Section
`);

      expect(
        extractTitle(headings)
      ).toBe("Requirements");
    });

    it("H1が存在しない場合は空文字を返す", () => {

      const headings =
        parseHeadings(`
## Section
`);

      expect(
        extractTitle(headings)
      ).toBe("");
    });

  });

  describe("parseLists", () => {

    it("箇条書きを解析できる", () => {

      const markdown = `
- Task A
- Task B
- Task C
`;

      const result =
        parseLists(markdown);

      expect(result)
        .toHaveLength(1);

      expect(result[0].items)
        .toEqual([
          "Task A",
          "Task B",
          "Task C"
        ]);
    });

    it("複数ブロックのリストを解析できる", () => {

      const markdown = `
- A
- B

text

- C
- D
`;

      const result =
        parseLists(markdown);

      expect(result)
        .toHaveLength(2);
    });

  });

  describe("parseTables", () => {

    it("Markdownテーブルを解析できる", () => {

      const markdown = `
| Name | Value |
|------|-------|
| A | 1 |
| B | 2 |
`;

      const result =
        parseTables(markdown);

      expect(result)
        .toHaveLength(1);

      expect(result[0].headers)
        .toEqual([
          "Name",
          "Value"
        ]);

      expect(result[0].rows)
        .toHaveLength(2);
    });

    it("テーブルが存在しない場合は空配列", () => {

      const markdown =
        "# Sample";

      const result =
        parseTables(markdown);

      expect(result)
        .toEqual([]);
    });

  });

  describe("parseMarkdownContent", () => {

    it("DocumentModelを生成できる", () => {

      const markdown = `
# Sample

## Section

- Task A

| Name | Value |
|------|-------|
| A | 1 |
`;

      const result =
        parseMarkdownContent(
          markdown
        );

      expect(result.title)
        .toBe("Sample");

      expect(result.headings)
        .toHaveLength(2);

      expect(result.lists)
        .toHaveLength(1);

      expect(result.tables)
        .toHaveLength(1);
    });

    it("空文字でも例外にならない", () => {

      const result =
        parseMarkdownContent("");

      expect(result.title)
        .toBe("");

      expect(result.headings)
        .toEqual([]);

      expect(result.lists)
        .toEqual([]);

      expect(result.tables)
        .toEqual([]);
    });

  });

});
