import path from "path";

import {
  parseMarkdownFile
} from "./markdownParser/parseMarkdownFile";

import {
  extractTasks
} from "./TaskExtractor";

import {
  extractDocuments
} from "./DocumentExtractor";

import {
  exportDocuments,
  exportTasks
} from "./JsonExporter";

export type ConvertResult = {
  taskCount: number;
  documentCount: number;
  tasksFile: string;
  documentsFile: string;
};

export const convertMarkdownFile =
  (
    markdownFile: string,
    outputDir: string
  ): ConvertResult => {

    const document =
      parseMarkdownFile(
        markdownFile
      );

    const tasks =
      extractTasks(
        document
      );

    const documents =
      extractDocuments(
        document
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
      taskCount:
        tasks.length,

      documentCount:
        documents.length,

      tasksFile,

      documentsFile
    };
  };

export const convertMarkdownFiles =
  (
    markdownFiles: string[],
    outputDir: string
  ) => {

    const documents =
      markdownFiles.map(
        parseMarkdownFile
      );

    const allTasks =
      documents.flatMap(
        extractTasks
      );

    const allDocuments =
      documents.flatMap(
        extractDocuments
      );

    const tasksFile =
      exportTasks(
        allTasks,
        outputDir
      );

    const documentsFile =
      exportDocuments(
        allDocuments,
        outputDir
      );

    return {

      taskCount:
        allTasks.length,

      documentCount:
        allDocuments.length,

      tasksFile,

      documentsFile

    };

  };

export const createOutputDirectory =
  (
    rootDir = "data"
  ) => {

    return path.join(
      rootDir,
      "generated"
    );

  };
