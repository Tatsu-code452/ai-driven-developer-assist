import fs from "fs";

export const readJson =
(
  filePath: string
) => {

  if (
    !fs.existsSync(
      filePath
    )
  ) {

    return null;

  }

  return JSON.parse(
    fs.readFileSync(
      filePath,
      "utf-8"
    )
  );
};
