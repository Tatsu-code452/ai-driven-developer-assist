import {
  NextFunction,
  Request,
  Response
} from "express";

export const validateProject = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const {
    name,
    rootPath
  } = req.body;

  if (
    !name ||
    name.length < 1 ||
    name.length > 255
  ) {

    return res.status(400)
      .json({
        message:
          "Invalid Project Name"
      });
  }

  if (!rootPath) {

    return res.status(400)
      .json({
        message:
          "rootPath required"
      });
  }

  next();
}
