import {
  Request,
  Response
} from "express";

import {
  loadTraceability
} from "@/repositories/TraceabilityRepository";

export const getTraceability =
(
  _req: Request,
  res: Response
) => {

  const items =
    loadTraceability(
      "data/generated"
    );

  res.json({

    success: true,

    items

  });

};
