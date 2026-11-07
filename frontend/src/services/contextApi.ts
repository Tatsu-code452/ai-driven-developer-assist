import { api }
from "./api";
import type { Context, ItemResponse, ItemsResponse } from "../types/Api";

export const fetchContexts =
async () => {

  const response =
    await api.get<ItemsResponse<Context>>(
      "/contexts"
    );

  return response.data;

};

export const fetchContextDetail =
async (
  id: string
) => {

  const response =
    await api.get<ItemResponse<Context>>(
      "/contexts/" +
      id
    );

  return response.data;

};
