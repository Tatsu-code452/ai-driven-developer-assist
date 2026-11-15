import fs from "fs";
import os from "os";
import path from "path";

import { afterEach, describe, expect, it } from "vitest";

import { loadManagementDataIndex } from "@/repositories/ManagementDataRepository";

const directories: string[] = [];

const createRoot = (readme?: string) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "management-data-"));
  directories.push(directory);

  if (readme !== undefined) {
    fs.writeFileSync(path.join(directory, "README.md"), readme, "utf-8");
  }

  return directory;
};

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("loadManagementDataIndex", () => {
  it("reports an unset path without throwing", () => {
    expect(loadManagementDataIndex("  ").status).toBe("root-path-not-set");
  });

  it("reports a missing folder", () => {
    const missing = path.join(os.tmpdir(), "management-data-does-not-exist");

    expect(loadManagementDataIndex(missing).status).toBe("root-path-not-found");
  });

  it("reports a missing README.md", () => {
    expect(loadManagementDataIndex(createRoot()).status).toBe("readme-not-found");
  });

  it("reports a README.md without the 管理データ一覧 section", () => {
    expect(loadManagementDataIndex(createRoot("# 管理データ\n")).status).toBe(
      "section-not-found",
    );
  });

  it("lists linked files with their existence", () => {
    const root = createRoot(
      [
        "## 管理データ一覧",
        "- [QA一覧](QA一覧.md)",
        "- [課題一覧](issue/README.md)",
        "- [未作成](missing.md)",
      ].join("\n"),
    );
    fs.writeFileSync(path.join(root, "QA一覧.md"), "# QA", "utf-8");
    fs.mkdirSync(path.join(root, "issue"));
    fs.writeFileSync(path.join(root, "issue", "README.md"), "# 課題", "utf-8");

    const index = loadManagementDataIndex(root);

    expect(index.status).toBe("ok");
    expect(index.items).toEqual([
      { title: "QA一覧", path: "QA一覧.md", exists: true },
      { title: "課題一覧", path: "issue/README.md", exists: true },
      { title: "未作成", path: "missing.md", exists: false },
    ]);
  });

  it("drops links that point outside the management data path", () => {
    const root = createRoot(
      [
        "## 管理データ一覧",
        "- [外部](https://example.com/a.md)",
        "- [親](../outside.md)",
        "- [絶対](/etc/passwd)",
        "- [配下](inside.md)",
      ].join("\n"),
    );

    expect(loadManagementDataIndex(root).items).toEqual([
      { title: "配下", path: "inside.md", exists: false },
    ]);
  });
});
