import {
  describe,
  expect,
  it
} from "vitest";

import {
  mergeTasks
} from "@/repositories/TaskRepository";

describe(
  "TaskRepository",
  () => {

    it(
      "重複Taskを除外",
      () => {

        const result =
          mergeTasks(

            [
              {
                id:"TSK-001",
                title:"API実装"
              } as any
            ],

            [
              {
                id:"TSK-002",
                title:"API実装"
              } as any
            ]

          );

        expect(
          result
        )
          .toHaveLength(
            1
          );

      }
    );

  }
);
