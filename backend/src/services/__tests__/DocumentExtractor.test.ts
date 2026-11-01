import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseMarkdownContent
} from "../MarkdownParser";

import {
  extractDocuments,
  detectDocumentType,
  createDocumentId
} from "../DocumentExtractor";

describe(
  "DocumentExtractor",
  () => {

    describe(
      "detectDocumentType",
      () => {

        it(
          "要件定義書をREQ判定",
          () => {

            const document =
              parseMarkdownContent(`
# 要件定義書
`);

            expect(
              detectDocumentType(
                document
              )
            ).toBe(
              "REQ"
            );

          }
        );

        it(
          "基本設計書をDES判定",
          () => {

            const document =
              parseMarkdownContent(`
# 基本設計書
`);

            expect(
              detectDocumentType(
                document
              )
            ).toBe(
              "DES"
            );

          }
        );

        it(
          "詳細設計書をDET判定",
          () => {

            const document =
              parseMarkdownContent(`
# 詳細設計書
`);

            expect(
              detectDocumentType(
                document
              )
            ).toBe(
              "DET"
            );

          }
        );

        it(
          "テスト仕様書をTST判定",
          () => {

            const document =
              parseMarkdownContent(`
# テスト仕様書
`);

            expect(
              detectDocumentType(
                document
              )
            ).toBe(
              "TST"
            );

          }
        );

      }
    );

    describe(
      "createDocumentId",
      () => {

        it(
          "REQ採番",
          () => {

            expect(
              createDocumentId(
                "REQ",
                1
              )
            ).toBe(
              "REQ-001"
            );

          }
        );

        it(
          "DES採番",
          () => {

            expect(
              createDocumentId(
                "DES",
                12
              )
            ).toBe(
              "DES-012"
            );

          }
        );

      }
    );

    describe(
      "extractDocuments",
      () => {

        it(
          "要件定義書からDocument生成",
          () => {

            const model =
              parseMarkdownContent(`
# 要件定義書
`);

            const result =
              extractDocuments(
                model
              );

            expect(result)
              .toHaveLength(1);

            expect(
              result[0].id
            ).toBe(
              "REQ-001"
            );

          }
        );

        it(
          "基本設計書からDocument生成",
          () => {

            const model =
              parseMarkdownContent(`
# 基本設計書
`);

            const result =
              extractDocuments(
                model
              );

            expect(
              result[0].type
            ).toBe(
              "DES"
            );

          }
        );

      }
    );

  }
);
