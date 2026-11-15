import fs from "fs";
import path from "path";

import type {
  Issue
} from "@/models/Issue";

const FILE_NAME =
  "issues.json";

export const loadIssues =
(
  outputDir: string
): Issue[] => {

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

export const saveIssues =
(
  items: Issue[],
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
