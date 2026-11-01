import {
  describe,
  expect,
  it
} from "vitest";

import {
  mergeDocuments
} from "@/repositories/DocumentRepository";

describe(
  "DocumentRepository",
  () => {

    it(
      "重複Documentを除外",
      () => {

        const result =
          mergeDocuments(

            [
              {
                id:"REQ-001",
                title:"要件定義書"
              } as any
            ],

            [
              {
                id:"REQ-002",
                title:"要件定義書"
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
