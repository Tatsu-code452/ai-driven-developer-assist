import {
  convertMarkdown
} from "@/services/ConverterService";

import {
  Request,
  Response
} from "express";

export const convertMarkdownHandler =
(
  req: Request,
  res: Response
) => {

  const content =
    req.body.content;

  if (!content) {

    return res
      .status(400)
      .json({

        success: false,

        message:
          "content is required"

      });

  }

  const result =
    convertMarkdown(
      content
    );

  return res.json({

    success: true,

    data: result

  });

};
