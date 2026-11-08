import fs from "fs";
import path from "path";

import type {
  ManagementDataIndex,
  ManagementDataIndexStatus,
  ManagementDataItem,
} from "@/models/ManagementData";
import {
  MANAGEMENT_DATA_SECTION_TITLE,
  parseManagementDataLinks,
} from "@/services/managementDataIndex/parseManagementDataIndex";

const README_FILE_NAME = "README.md";
const EXTERNAL_LINK_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

const isDirectory = (target: string): boolean =>
  fs.existsSync(target) && fs.statSync(target).isDirectory();

const isFile = (target: string): boolean =>
  fs.existsSync(target) && fs.statSync(target).isFile();

const createIndex = (
  status: ManagementDataIndexStatus,
  message: string,
  rootPath: string,
  items: ManagementDataItem[] = [],
): ManagementDataIndex => ({ status, message, rootPath, items });

/**
 * リンク先を管理データパス配下に限定して解決する。
 * 外部URL・絶対パス・配下の外へ出る相対パスは対象外(undefined)とする。
 */
const resolveInsideRoot = (
  root: string,
  href: string,
): { absolute: string; relative: string } | undefined => {
  if (EXTERNAL_LINK_PATTERN.test(href) || path.isAbsolute(href)) {
    return undefined;
  }

  const absolute = path.resolve(root, href);
  const relative = path.relative(root, absolute);

  if (
    !relative ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    return undefined;
  }

  return { absolute, relative: relative.split(path.sep).join("/") };
};

export const loadManagementDataIndex = (
  rootPath: string,
): ManagementDataIndex => {
  const configuredPath = rootPath.trim();

  if (!configuredPath) {
    return createIndex(
      "root-path-not-set",
      "プロジェクトに管理データパスが設定されていません。",
      rootPath,
    );
  }

  const root = path.resolve(configuredPath);

  if (!isDirectory(root)) {
    return createIndex(
      "root-path-not-found",
      "管理データパスのフォルダーが見つかりません。パスとバックエンドの実行環境を確認してください。",
      rootPath,
    );
  }

  const readmePath = path.join(root, README_FILE_NAME);

  if (!isFile(readmePath)) {
    return createIndex(
      "readme-not-found",
      `管理データパス直下に${README_FILE_NAME}がありません。`,
      rootPath,
    );
  }

  const links = parseManagementDataLinks(fs.readFileSync(readmePath, "utf-8"));

  if (!links) {
    return createIndex(
      "section-not-found",
      `${README_FILE_NAME}に「${MANAGEMENT_DATA_SECTION_TITLE}」の見出しがありません。`,
      rootPath,
    );
  }

  const items = links.flatMap((link): ManagementDataItem[] => {
    const target = resolveInsideRoot(root, link.href);

    return target
      ? [{
          title: link.title,
          path: target.relative,
          exists: fs.existsSync(target.absolute),
        }]
      : [];
  });

  return createIndex("ok", "", rootPath, items);
};
