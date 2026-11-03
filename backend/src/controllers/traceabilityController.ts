import {
  loadTraceability
} from "@/repositories/TraceabilityRepository";

export const getTraceability =
(
  _req,
  res
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
