import { api }
from "./api";
import type { ItemsResponse, TraceabilityMatrixItem } from "../types/Api";

export const fetchMatrix =
async () => {

  const response =
    await api.get<ItemsResponse<TraceabilityMatrixItem>>(
      "/traceability/matrix"
    );

  return response.data;

};
