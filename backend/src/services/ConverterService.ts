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
  loadTasks,
  mergeTasks,
  saveTasks
} from "@/repositories/TaskRepository";

import {
  loadDocuments,
  mergeDocuments,
  saveDocuments
} from "@/repositories/DocumentRepository";

export const convertMarkdown =
(
  markdown: string,
  outputRoot = "data"
) => {

  const document =
    parseMarkdownContent(
      markdown
    );

  const outputDir =
    path.join(
      outputRoot,
      "generated"
    );

  const newTasks =
    extractTasks(
      document
    );

  const newDocuments =
    extractDocuments(
      document
    );

  const currentTasks =
    loadTasks(
      outputDir
    );

  const currentDocuments =
    loadDocuments(
      outputDir
    );

  const mergedTasks =
    mergeTasks(
      currentTasks,
      newTasks
    );

  const mergedDocuments =
    mergeDocuments(
      currentDocuments,
      newDocuments
    );

  const tasksFile =
    saveTasks(
      mergedTasks,
      outputDir
    );

  const documentsFile =
    saveDocuments(
      mergedDocuments,
      outputDir
    );

  return {

    document,

    tasks:
      mergedTasks,

    documents:
      mergedDocuments,

    output: {

      tasksFile,

      documentsFile

    },

    summary: {

      taskCount:
        mergedTasks.length,

      documentCount:
        mergedDocuments.length

    }

  };

};
