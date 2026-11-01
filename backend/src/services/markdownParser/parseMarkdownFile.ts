import { DocumentModel } from "@/models/DocumentModel";
import { parseMarkdownContent } from "@/services/markdownParser/parseMarkdownContent";
import fs from "fs";
import path from "path";

/**
 * マークダウンファイルを解析する
 * @param filePath ファイルパス
 * @returns 解析されたドキュメントモデル
 */
export const parseMarkdownFile = (
    filePath: string
): DocumentModel => {

    const content = fs.readFileSync(filePath, "utf-8");

    const document = parseMarkdownContent(content);

    return {
        ...document,
        fileName: path.basename(filePath)
    };
};

