import { DocumentModel } from "@/models/DocumentModel";
import { parseLists } from "@/services/markdownParser/parseMarkdownList";
import { parseTables } from "@/services/markdownParser/parseMarkdownTable";
import { extractTitle, parseHeadings } from "@/services/markdownParser/parseUtils";

/**
 * マークダウンコンテンツを解析する
 * @param content マークダウンコンテンツ
 * @returns 解析されたドキュメントモデル
 */
export const parseMarkdownContent = (
    content: string
): DocumentModel => {

    const headings = parseHeadings(content);

    return {
        fileName: "",
        title: extractTitle(headings),
        rawContent: content,
        headings,
        lists: parseLists(content),
        tables: parseTables(content)
    };
};
