import fs from "node:fs";

const LOG_FILE =
  "backend/data/audit.log";

export class AuditLogger {

  static write(
    action: string,
    payload: unknown
  ) {

    const line =
      JSON.stringify({
        timestamp:
          new Date().toISOString(),
        action,
        payload
      });

    fs.appendFileSync(
      LOG_FILE,
      line + "\n"
    );
  }
}
