import fs from "fs";
import path from "path";

import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach
} from "vitest";

import {
  exportTasks,
  exportDocuments,
  exportJson
} from "../JsonExporter";

const OUTPUT_DIR =
  path.join(
    process.cwd(),
    ".test-output"
  );

describe(
  "JsonExporter",
  () => {

    beforeEach(
      () => {

        if (
          fs.existsSync(
            OUTPUT_DIR
          )
        ) {

          fs.rmSync(
            OUTPUT_DIR,
            {
              recursive: true,
              force: true
            }
          );

        }

      }
    );

    afterEach(
      () => {

        if (
          fs.existsSync(
            OUTPUT_DIR
          )
        ) {

          fs.rmSync(
            OUTPUT_DIR,
            {
              recursive: true,
              force: true
            }
          );

        }

      }
    );

    it(
      "任意のJSONを書き出せる",
      () => {

        const filePath =
          exportJson({
            outputDir:
              OUTPUT_DIR,
            fileName:
              "sample.json",
            data: {
              id: 1
            }
          });

        expect(
          fs.existsSync(
            filePath
          )
        )
          .toBe(true);

      }
    );

    it(
      "tasks.jsonを書き出せる",
      () => {

        const filePath =
          exportTasks(
            [
              {
                id:
                  "TSK-001"
              }
            ],
            OUTPUT_DIR
          );

        expect(
          path.basename(
            filePath
          )
        )
          .toBe(
            "tasks.json"
          );

      }
    );

    it(
      "documents.jsonを書き出せる",
      () => {

        const filePath =
          exportDocuments(
            [
              {
                id:
                  "REQ-001"
              }
            ],
            OUTPUT_DIR
          );

        expect(
          path.basename(
            filePath
          )
        )
          .toBe(
            "documents.json"
          );

      }
    );

    it(
      "JSON内容が保存される",
      () => {

        const filePath =
          exportTasks(
            [
              {
                id:
                  "TSK-001",
                title:
                  "Task"
              }
            ],
            OUTPUT_DIR
          );

        const json =
          JSON.parse(
            fs.readFileSync(
              filePath,
              "utf-8"
            )
          );

        expect(
          json[0].id
        )
          .toBe(
            "TSK-001"
          );

      }
    );

  }
);
