import fs from "fs";
import path from "path";

import type {
  Traceability
} from "@/models/Traceability";

const FILE_NAME =
  "traceability.json";

export const loadTraceability =
  (
    outputDir: string
  ) => {

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

export const saveTraceability =
  (
    items:
      Traceability[],
    outputDir: string
  ) => {

    fs.mkdirSync(
      outputDir,
      {
        recursive: true
      }
    );

    fs.writeFileSync(

      path.join(
        outputDir,
        FILE_NAME
      ),

      JSON.stringify(
        items,
        null,
        2
      ),

      "utf-8"

    );

  };

export const mergeTraceability =
  (
    current:
      Traceability[],

    incoming:
      Traceability[]

  ): Traceability[] => {

    const map =
      new Map<
        string,
        Traceability
      >();

    [
      ...current,
      ...incoming
    ]
      .forEach(
        item => {

          const key =

            item.sourceId
            + "|"
            + item.targetId
            + "|"
            + item.relationType;

          map.set(
            key,
            item
          );

        }
      );

    return [
      ...map.values()
    ];

  };
