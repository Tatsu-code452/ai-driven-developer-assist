import {
  Request,
  Response
} from "express";

export const getIssues =
(
  _req: Request,
  res: Response
) => {

  res.json({

    success: true,

    items: [

      {

        id:
          "BUG-001",

        title:
          "採番重複対応",

        status:
          "OPEN"

      }

    ]

  });

};
