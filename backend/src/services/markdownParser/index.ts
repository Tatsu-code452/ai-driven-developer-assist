import { DocumentModel } from "@/models/DocumentModel";
import { parseMarkdownFile } from "@/services/markdownParser/parseMarkdownFile";

/**
 * ファイルを受け取り、markdownをパースしてDocumentModelを返す
 * @param filePath ファイルのパス
 * @returns パース結果
 * 
 */
export const execute = async (filePath: string): Promise<DocumentModel> => {
    return parseMarkdownFile(filePath);
}
