import type {
  Document
} from "@/models/Document";

import type {
  Task
} from "@/models/Task";

import type {
  Traceability
} from "@/models/Traceability";

export const buildTraceability =
(
  documents: Document[],
  tasks: Task[]
): Traceability[] => {

  const result:
    Traceability[] = [];

  documents.forEach(
    document => {

      tasks.forEach(
        task => {

          const relationType =
            document.type === "REQ"
              ? "REQ-TSK"
              : document.type === "DES"
                ? "DES-TSK"
                : null;

          if (
            !relationType
          ) {
            return;
          }

          result.push({

            sourceId:
              document.id,

            targetId:
              task.id,

            relationType

          });

        }
      );

    }
  );

  return result;

};
