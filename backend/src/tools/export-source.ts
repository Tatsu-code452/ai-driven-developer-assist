import fs from "fs";
import path from "path";

const IGNORE_DIRS = [

  "node_modules",
  "dist",
  ".git",
  "coverage"

];

const collectFiles =
(
  directory: string
): string[] => {

  const entries =
    fs.readdirSync(
      directory,
      {
        withFileTypes:true
      }
    );

  return entries.flatMap(
    entry => {

      const fullPath =
        path.join(
          directory,
          entry.name
        );

      if (
        entry.isDirectory()
      ) {

        if (
          IGNORE_DIRS.includes(
            entry.name
          )
        ) {
          return [];
        }

        return collectFiles(
          fullPath
        );
      }

      return [fullPath];

    }
  );
};

const exportSource =
(
  targetDir: string,
  outputFile: string
) => {

  const files =
    collectFiles(
      targetDir
    );

  let output = "";

  for (
    const file of files
  ) {

    output +=
      "\n" +
      "=".repeat(80) +
      "\n";

    output +=
      "FILE: " +
      file +
      "\n";

    output +=
      "=".repeat(80) +
      "\n\n";

    output +=
      fs.readFileSync(
        file,
        "utf-8"
      );

    output +=
      "\n\n";
  }

  fs.writeFileSync(
    outputFile,
    output,
    "utf-8"
  );

  console.log(
    "Export Complete:"
    + outputFile
  );
};

const targetDir =
  process.argv[2];

const outputFile =
  process.argv[3] ??
  "source-export.txt";

if (
  !targetDir
) {

  console.error(
    "Usage: export-source <dir>"
  );

  process.exit(1);

}

exportSource(
  targetDir,
  outputFile
);
