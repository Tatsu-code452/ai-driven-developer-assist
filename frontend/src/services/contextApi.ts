import { api }
from "./api";

import type {
  Context,
  ItemResponse,
  ItemsResponse
} from "../types/Api";

export const fetchContexts =
async (
  projectId?: string
) => {

  const query =
    projectId
      ? `?projectId=${encodeURIComponent(projectId)}`
      : "";

  const response =
    await api.get<
      ItemsResponse<Context>
    >(
      "/contexts" +
      query
    );

  return response.data;

};

export const fetchContextDetail =
async (
  id: string,
  projectId?: string
) => {

  const query =
    projectId
      ? `?projectId=${encodeURIComponent(projectId)}`
      : "";

  const response =
    await api.get<
      ItemResponse<Context>
    >(
      "/contexts/" +
      id +
      query
    );

  return response.data;

};
