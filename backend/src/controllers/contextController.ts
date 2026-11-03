import {
  Request,
  Response
} from "express";

import {
  loadContexts
} from "@/repositories/ContextRepository";

export const getContexts =
(
  _req: Request,
  res: Response
) => {

  const contexts =
    loadContexts(
      "data/generated"
    );

  res.json({

    success: true,

    items:
      contexts,

    count:
      contexts.length

  });

};

export const getContextDetail =
(
  req: Request,
  res: Response
) => {

  const contexts =
    loadContexts(
      "data/generated"
    );

  const item =
    contexts.find(
      context =>
        context.id ===
        req.params.id
    );

  if (!item) {

    return res
      .status(404)
      .json({

        success: false

      });

  }

  res.json({

    success: true,

    item

  });

};
