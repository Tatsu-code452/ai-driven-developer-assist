import path from "path";

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

import {
  createIdAllocator
} from "@/services/idGenerator/IdGenerator";

import {
  extractTasks
} from "@/services/TaskExtractor";

import {
  extractDocuments,
  detectDocumentType
} from "@/services/DocumentExtractor";

import {
  parseMarkdownContent
} from "@/services/markdownParser/parseMarkdownContent";

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

  const currentTasks =
    loadTasks(
      outputDir
    );

  const currentDocuments =
    loadDocuments(
      outputDir
    );

  const taskAllocator =
    createIdAllocator(
      "TSK",
      currentTasks
    );

  const docType =
    detectDocumentType(
      document
    );

  const documentAllocator =
    createIdAllocator(
      docType,
      currentDocuments
    );

  const newTasks =
    extractTasks(
      document,
      {
        nextId:
          taskAllocator
      }
    );

  const newDocuments =
    extractDocuments(
      document,
      {
        nextId:
          documentAllocator
      }
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
