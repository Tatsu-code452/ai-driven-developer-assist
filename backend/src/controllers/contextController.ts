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

  const items =
    loadContexts(
      "data/generated"
    );

  res.json({

    success: true,

    items,

    count:
      items.length

  });

};

export const getContextDetail =
(
  req: Request,
  res: Response
) => {

  const items =
    loadContexts(
      "data/generated"
    );

  const item =
    items.find(
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
