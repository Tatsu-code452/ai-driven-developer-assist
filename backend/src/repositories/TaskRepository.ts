import fs from "fs";
import path from "path";

import type { Task } from "@/models/Task";

const FILE_NAME =
  "tasks.json";

export const loadTasks = (
  outputDir: string
): Task[] => {

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

export const saveTasks = (
  tasks: Task[],
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
      tasks,
      null,
      2
    ),
    "utf-8"
  );

  return filePath;
};

export const mergeTasks = (
  current: Task[],
  incoming: Task[]
): Task[] => {

  const map =
    new Map<
      string,
      Task
    >();

  current.forEach(
    task =>
      map.set(
        task.id,
        task
      )
  );

  incoming.forEach(
    task => {

      const exists =
        [...map.values()]
          .find(
            item =>
              item.title ===
              task.title
          );

      if (
        exists
      ) {
        return;
      }

      map.set(
        task.id,
        task
      );

    }
  );

  return [
    ...map.values()
  ];
};
