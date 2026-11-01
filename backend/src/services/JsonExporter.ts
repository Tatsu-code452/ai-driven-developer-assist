import fs from "fs";
import path from "path";

type ExportOptions<T> = {
  outputDir: string;
  fileName: string;
  data: T;
};

const ensureDirectory = (
  directory: string
): void => {

  if (
    fs.existsSync(directory)
  ) {
    return;
  }

  fs.mkdirSync(
    directory,
    {
      recursive: true
    }
  );
};

export const exportJson = <
  T
>(
  options:
    ExportOptions<T>
): string => {

  ensureDirectory(
    options.outputDir
  );

  const filePath =
    path.join(
      options.outputDir,
      options.fileName
    );

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      options.data,
      null,
      2
    ),
    "utf-8"
  );

  return filePath;
};

export const exportTasks = (
  tasks: unknown[],
  outputDir: string
): string => {

  return exportJson({
    outputDir,
    fileName:
      "tasks.json",
    data: tasks
  });

};

export const exportDocuments = (
  documents: unknown[],
  outputDir: string
): string => {

  return exportJson({
    outputDir,
    fileName:
      "documents.json",
    data: documents
  });

};

export const exportIssues = (
  issues: unknown[],
  outputDir: string
): string => {

  return exportJson({
    outputDir,
    fileName:
      "issues.json",
    data: issues
  });

};

export const exportQAs = (
  qas: unknown[],
  outputDir: string
): string => {

  return exportJson({
    outputDir,
    fileName:
      "qa.json",
    data: qas
  });

};

export const exportTraceability =
(
  items: unknown[],
  outputDir: string
): string => {

  return exportJson({
    outputDir,
    fileName:
      "traceability.json",
    data: items
  });

};
