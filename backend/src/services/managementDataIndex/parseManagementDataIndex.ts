export const MANAGEMENT_DATA_SECTION_TITLE = "管理データ一覧";

export type ManagementDataLink = {
  title: string;
  href: string;
};

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;
const LINK_ITEM_PATTERN = /^\s*[-*+]\s+\[([^\]]+)\]\(([^)\s]+)\)\s*$/;

const toHref = (rawTarget: string): string => {
  const withoutAnchor = rawTarget.split("#")[0] ?? "";

  try {
    return decodeURI(withoutAnchor);
  } catch {
    return withoutAnchor;
  }
};

/**
 * README.md から「管理データ一覧」見出し配下の箇条書きリンクを取り出す。
 * 見出しが存在しない場合は undefined、存在してリンクがなければ空配列を返す。
 */
export const parseManagementDataLinks = (
  markdown: string,
): ManagementDataLink[] | undefined => {
  const lines = markdown.replace(/^\uFEFF/, "").split(/\r?\n/);
  const links: ManagementDataLink[] = [];

  let sectionLevel: number | undefined;
  let found = false;
  let inFence = false;

  for (const line of lines) {
    if (FENCE_PATTERN.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    const heading = HEADING_PATTERN.exec(line);

    if (heading) {
      const level = heading[1].length;

      if (sectionLevel !== undefined && level <= sectionLevel) {
        break;
      }

      if (sectionLevel === undefined && heading[2] === MANAGEMENT_DATA_SECTION_TITLE) {
        sectionLevel = level;
        found = true;
      }

      continue;
    }

    if (sectionLevel === undefined) {
      continue;
    }

    const item = LINK_ITEM_PATTERN.exec(line);
    const href = item ? toHref(item[2]) : "";

    if (item && href) {
      links.push({ title: item[1].trim(), href });
    }
  }

  return found ? links : undefined;
};
