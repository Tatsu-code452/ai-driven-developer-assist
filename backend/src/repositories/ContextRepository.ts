import fs from "fs";
import path from "path";

import type {
  Context
} from "@/models/Context";

const FILE_NAME =
  "contexts.json";

export const loadContexts =
(
  outputDir: string
): Context[] => {

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

export const saveContexts =
(
  items: Context[],
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
      items,
      null,
      2
    ),
    "utf-8"
  );

  return filePath;

};
