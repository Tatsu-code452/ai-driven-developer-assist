import { describe, expect, it } from "vitest";

import { parseManagementDataLinks } from "@/services/managementDataIndex/parseManagementDataIndex";

describe("parseManagementDataLinks", () => {
  it("extracts bullet links under the 管理データ一覧 heading only", () => {
    const markdown = [
      "# 管理データ",
      "",
      "## 管理データ一覧",
      "",
      "- [課題一覧・状態管理](issue/README.md)",
      "- [QA一覧](QA一覧.md)",
      "",
      "## 開発標準",
      "",
      "- [コーディング規約](../01基本設計/コーディング規約.md)",
    ].join("\n");

    expect(parseManagementDataLinks(markdown)).toEqual([
      { title: "課題一覧・状態管理", href: "issue/README.md" },
      { title: "QA一覧", href: "QA一覧.md" },
    ]);
  });

  it("returns undefined when the heading does not exist", () => {
    expect(parseManagementDataLinks("# 管理データ\n\n- [A](a.md)")).toBeUndefined();
  });

  it("returns an empty list when the section has no links", () => {
    expect(parseManagementDataLinks("## 管理データ一覧\n\n(なし)\n")).toEqual([]);
  });

  it("handles CRLF, BOM, anchors and percent-encoded targets", () => {
    const markdown =
      "\uFEFF## 管理データ一覧\r\n- [要件](requirements/README.md#top)\r\n- [空白](a%20b.md)\r\n";

    expect(parseManagementDataLinks(markdown)).toEqual([
      { title: "要件", href: "requirements/README.md" },
      { title: "空白", href: "a b.md" },
    ]);
  });

  it("ignores headings and links inside fenced code blocks", () => {
    const markdown = [
      "```",
      "## 管理データ一覧",
      "- [偽](fake.md)",
      "```",
      "## 管理データ一覧",
      "- [本物](real.md)",
    ].join("\n");

    expect(parseManagementDataLinks(markdown)).toEqual([
      { title: "本物", href: "real.md" },
    ]);
  });

  it("ends the section at a heading of the same or higher level, keeping subsections", () => {
    const markdown = [
      "## 管理データ一覧",
      "- [A](a.md)",
      "### 補足",
      "- [B](b.md)",
      "# 別の章",
      "- [C](c.md)",
    ].join("\n");

    expect(parseManagementDataLinks(markdown)).toEqual([
      { title: "A", href: "a.md" },
      { title: "B", href: "b.md" },
    ]);
  });
});
