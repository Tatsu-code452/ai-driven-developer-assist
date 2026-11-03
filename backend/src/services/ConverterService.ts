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
  detectDocumentType,
  extractDocuments
} from "@/services/DocumentExtractor";

import {
  parseMarkdownContent
} from "@/services/markdownParser/parseMarkdownContent";

import {
  loadContexts,
  saveContexts
} from "@/repositories/ContextRepository";

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

    const contexts =
      loadContexts(
        outputDir
      );

    const contextId =
      "CTX-" +
      String(
        contexts.length + 1
      ).padStart(
        3,
        "0"
      );

    contexts.push({

      id:
        contextId,

      title:
        document.title,

      description:
        document.title,

      type:
        docType,

      status:
        "ACTIVE",

      documentIds:
        newDocuments.map(
          d => d.id
        ),

      taskIds:
        newTasks.map(
          t => t.id
        ),

      issueIds: [],

      qaIds: [],

      createdAt:
        new Date()
          .toISOString(),

      updatedAt:
        new Date()
          .toISOString()

    });

    saveContexts(
      contexts,
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
