import {
  describe,
  expect,
  it
} from "vitest";

import {
  getNextId,
  createIdAllocator
} from "../idGenerator/IdGenerator";

describe(
  "IdGenerator",
  () => {

    it(
      "次のTaskID取得",
      () => {

        const id =
          getNextId(
            "TSK",
            [
              {
                id:
                "TSK-001"
              },
              {
                id:
                "TSK-002"
              }
            ]
          );

        expect(id)
          .toBe(
            "TSK-003"
          );

      }
    );

    it(
      "採番連続生成",
      () => {

        const next =
          createIdAllocator(
            "REQ",
            [
              {
                id:
                "REQ-005"
              }
            ]
          );

        expect(
          next()
        )
          .toBe(
            "REQ-006"
          );

        expect(
          next()
        )
          .toBe(
            "REQ-007"
          );

      }
    );

  }
);
