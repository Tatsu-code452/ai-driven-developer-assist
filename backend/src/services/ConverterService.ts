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
import { buildContext } from "@/services/contextBuilder/buildContext";

import {
  buildTraceability
} from "@/services/traceabilityBuilder/buildTraceability";

import {
  loadTraceability,
  mergeTraceability,
  saveTraceability
} from "@/repositories/TraceabilityRepository";

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

    const contextAllocator =
      createIdAllocator(
        "CTX",
        contexts
      );

    const context =
      buildContext(
        contextAllocator(),
        document.title,
        docType,
        newTasks.map(
          task => task.id
        ),
        newDocuments.map(
          doc => doc.id
        )
      );

    contexts.push(
      context
    );

    saveContexts(
      contexts,
      outputDir
    );

    const currentTraceability =
      loadTraceability(
        outputDir
      );

    const generatedTraceability =
      buildTraceability(
        newDocuments,
        newTasks
      );

    const mergedTraceability =
      mergeTraceability(
        currentTraceability,
        generatedTraceability
      );

    saveTraceability(
      mergedTraceability,
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
