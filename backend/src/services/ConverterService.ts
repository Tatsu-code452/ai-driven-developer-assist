import path from "path";

import {
  parseMarkdownContent
} from "@/services/markdownParser/parseMarkdownContent";

import {
  extractTasks
} from "@/services/TaskExtractor";

import {
  extractDocuments
} from "@/services/DocumentExtractor";

import {
  exportTasks,
  exportDocuments
} from "@/services/JsonExporter";

export const convertMarkdown =
(
  markdown: string,
  outputRoot = "data"
) => {

  const document =
    parseMarkdownContent(
      markdown
    );

  const tasks =
    extractTasks(
      document
    );

  const documents =
    extractDocuments(
      document
    );

  const outputDir =
    path.join(
      outputRoot,
      "generated"
    );

  const tasksFile =
    exportTasks(
      tasks,
      outputDir
    );

  const documentsFile =
    exportDocuments(
      documents,
      outputDir
    );

  return {

    document,

    tasks,

    documents,

    output: {

      tasksFile,

      documentsFile

    },

    summary: {

      taskCount:
        tasks.length,

      documentCount:
        documents.length

    }

  };

};
