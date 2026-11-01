import { Heading } from "@/models/Heading";
import { BREAK_LINE, HEADING } from "@/utils/textConst";

/**
 * マークダウンコンテンツから見出しを抽出する
 * @param content マークダウンコンテンツ
 * @returns 抽出された見出しの配列
 */
export const parseHeadings = (
  content: string
): Heading[] => {

  const lines = content.split(BREAK_LINE);

  return lines
    .map((line, index) => {
      const match = line.match(HEADING);

      if (!match) {
        return null;
      }

      return {
        level: match[1].length,
        text: match[2].trim(),
        lineNumber: index + 1
      };
    })
    .filter(
      (heading): heading is Heading => heading !== null
    );
};

/**
 * 見出しからタイトルを抽出する
 * @param headings 見出しの配列
 * @returns 抽出されたタイトル
 */
export const extractTitle = (
  headings: Heading[]
): string => {

  const h1 =
    headings.find(
      heading => heading.level === 1
    );

  return h1?.text ?? "";
};
