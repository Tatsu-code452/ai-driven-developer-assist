import {
  Request,
  Response
} from "express";

import {
  loadTraceability
} from "@/repositories/TraceabilityRepository";

export const getMatrix =
(
  _req: Request,
  res: Response
) => {

  const items =
    loadTraceability(
      "data/generated"
    );

  const matrix =
    items.map(
      item => ({

        source:
          item.sourceId,

        target:
          item.targetId,

        relation:
          item.relationType

      })
    );

  res.json({

    success: true,

    items:
      matrix

  });

};
