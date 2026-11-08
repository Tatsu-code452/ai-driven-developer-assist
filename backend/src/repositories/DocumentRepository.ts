import fs from "fs";
import path from "path";

import type { Document } from "@/models/Document";

const FILE_NAME =
  "documents.json";

export const loadDocuments =
  (
    outputDir: string
  ): Document[] => {

    const filePath =
      path.join(
        outputDir,
        FILE_NAME
      );

    if (
      !fs.existsSync(
        filePath
      )
    ) {
      return [];
    }

    return JSON.parse(
      fs.readFileSync(
        filePath,
        "utf-8"
      )
    );

  };

export const loadDocumentsGrouped =
  (
    outputDir: string
  ): Map<string, Document[]> => {

    const documents =
      loadDocuments(
        outputDir
      );

    return documents.reduce(
      (
        acc,
        document
      ) => {
        if (!document.projectId) {
          return acc;
        }

        const projectDocuments = acc.get(document.projectId) ?? [];
        projectDocuments.push(document);
        acc.set(document.projectId, projectDocuments);

        return acc;
      },
      new Map<string, Document[]>()
    );
  }

export const saveDocuments =
  (
    documents: Document[],
    outputDir: string
  ) => {

    fs.mkdirSync(
      outputDir,
      {
        recursive: true
      }
    );

    const filePath =
      path.join(
        outputDir,
        FILE_NAME
      );

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        documents,
        null,
        2
      ),
      "utf-8"
    );

    return filePath;
  };

export const mergeDocuments =
  (
    current: Document[],
    incoming: Document[]
  ): Document[] => {

    const map =
      new Map<
        string,
        Document
      >();

    current.forEach(
      document =>

        map.set(
          document.id,
          document
        )

    );

    incoming.forEach(
      document => {

        const exists =
          [...map.values()]
            .find(
              item =>
                item.title ===
                document.title
            );

        if (
          exists
        ) {
          return;
        }

        map.set(
          document.id,
          document
        );

      }
    );

    return [
      ...map.values()
    ];

  };
