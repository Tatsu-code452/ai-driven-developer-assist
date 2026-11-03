import {
  Request,
  Response
} from "express";

export const getQAs =
(
  _req: Request,
  res: Response
) => {

  res.json({

    success: true,

    items: [

      {

        id:
          "QAA-001",

        question:
          "採番方式検討",

        status:
          "OPEN"

      }

    ]

  });

};
