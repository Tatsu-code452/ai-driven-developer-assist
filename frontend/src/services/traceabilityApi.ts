import { api }
from "./api";
import type { ItemsResponse, TraceabilityItem } from "../types/Api";

export const fetchTraceability =
async () => {

  const response =
    await api.get<ItemsResponse<TraceabilityItem>>(
      "/traceability"
    );

  return response.data;

};
