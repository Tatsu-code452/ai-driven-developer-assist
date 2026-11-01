import { MarkdownTable } from "@/models/MarkdownTable";
import { BREAK_LINE, TABLE_SEPARATOR } from "@/utils/textConst";

/**
 * マークダウンコンテンツからテーブルを抽出する
 * @param content マークダウンコンテンツ
 * @returns 抽出されたテーブルの配列
 */
export const parseTables = (
  content: string
): MarkdownTable[] => {

  const lines = content.split(BREAK_LINE);
  const tables: MarkdownTable[] = [];

  let index = 0;
  while (
    index < lines.length
  ) {
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];
    const isHeader = headerLine?.includes("|");

    const isSeparator =
      separatorLine &&
      TABLE_SEPARATOR.test(separatorLine);

    if (!isHeader || !isSeparator) {
      index++;
      continue;
    }

    const headers = parseTableRow(headerLine);
    const rows: string[][] = [];

    let rowIndex = index + 2;

    while (
      rowIndex < lines.length &&
      lines[rowIndex].includes("|")
    ) {
      rows.push(parseTableRow(lines[rowIndex]));
      rowIndex++;
    }

    tables.push({
      headers,
      rows,
      lineNumber: index + 1
    });

    index = rowIndex;
  }

  return tables;
};

/**
 * テーブルの行を解析する
 * @param line テーブルの行
 * @returns 解析されたセルの配列
 */
const parseTableRow = (
  line: string
): string[] => {

  return line
    .split("|")
    .map(
      item => item.trim()
    )
    .filter(
      item => item.length > 0
    );
};
