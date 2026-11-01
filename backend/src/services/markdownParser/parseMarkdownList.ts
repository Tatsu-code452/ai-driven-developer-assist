import { MarkdownList } from "@/models/MarkdownList";
import { BREAK_LINE, LIST_ITEM } from "@/utils/textConst";

/**
 * Markdownのリストをパースする
 * @param content パース対象の文字列
 * @returns パース結果
 */
export const parseLists = (
  content: string
): MarkdownList[] => {

  const lines = content.split(BREAK_LINE);

  const result: MarkdownList[] = [];

  let currentItems: string[] = [];

  let startLine = 0;

  const flush = () => {
    if (currentItems.length === 0) {
      return;
    }

    result.push({
      items: [...currentItems],
      lineNumber: startLine
    });

    currentItems = [];
    startLine = 0;
  };

  lines.forEach((line, index) => {
    const match = line.match(LIST_ITEM);

    if (match) {

      if (currentItems.length === 0) {
        startLine = index + 1;
      }

      currentItems.push(match[2].trim());

      return;
    }

    flush();
  });

  flush();

  return result;
};
