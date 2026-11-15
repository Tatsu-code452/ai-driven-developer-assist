import {
  NextFunction,
  Request,
  Response
} from "express";
import fs from "node:fs";

const FILE =
  "backend/data/current-project.json";

export const currentProjectMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    if (!fs.existsSync(FILE)) {
      return next();
    }

    const current =
      JSON.parse(
        fs.readFileSync(
          FILE,
          "utf8"
        )
      );

    (req as any).currentProject =
      current;

    next();

  } catch (e) {

    next(e);
  }
}
