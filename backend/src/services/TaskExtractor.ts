import type { DocumentModel } from "../models/DocumentModel";
import type { Task } from "../models/Task";

const TASK_KEYWORDS = [

  "作成",
  "実装",
  "対応",
  "修正",
  "追加",
  "削除",
  "変更",

  "作る",
  "実施",

  "Create",
  "Implement",
  "Fix",
  "Update"

];

const TASK_SECTION_KEYWORDS = [

  "タスク",
  "Task",
  "TODO",
  "ToDo",
  "WBS",
  "実装"

];

export const extractTasks = (
  document: DocumentModel
): Task[] => {

  const tasksFromLists =
    extractTasksFromLists(
      document
    );

  const uniqueTasks =
    uniqueByTitle(
      tasksFromLists
    );

  return uniqueTasks.map(
    (task, index) => ({
      ...task,
      id:
        "TSK-" +
        String(
          index + 1
        ).padStart(
          3,
          "0"
        )
    })
  );
};

const extractTasksFromLists = (
  document: DocumentModel
): Omit<Task, "id">[] => {

  const tasks:
    Omit<Task, "id">[] = [];

  for (
    const list of document.lists
  ) {

    for (
      const item of list.items
    ) {

      if (
        !isTaskCandidate(
          item
        )
      ) {
        continue;
      }

      tasks.push({
        title:
          normalizeTitle(
            item
          ),

        description:
          item,

        status:
          "TODO",

        priority:
          "NORMAL",

        source:
          document.title
      });
    }
  }

  return tasks;
};

const isTaskCandidate = (
  text: string
): boolean => {

  return TASK_KEYWORDS.some(
    keyword =>
      text.includes(
        keyword
      )
  );
};

const normalizeTitle = (
  text: string
): string => {

  return text
    .replace(
      /^\[[ xX]\]\s*/,
      ""
    )
    .trim();
};

const uniqueByTitle = <
  T extends {
    title: string;
  }
>(
  values: T[]
): T[] => {

  const map =
    new Map<
      string,
      T
    >();

  values.forEach(
    value => {

      if (
        map.has(
          value.title
        )
      ) {
        return;
      }

      map.set(
        value.title,
        value
      );

    }
  );

  return [
    ...map.values()
  ];
};

export const hasTaskSection =
  (
    document: DocumentModel
  ): boolean => {

    return document.headings.some(
      heading =>

        TASK_SECTION_KEYWORDS.some(
          keyword =>
            heading.text.includes(
              keyword
            )
        )

    );
  };
