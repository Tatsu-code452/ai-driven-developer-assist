import { api } from "./api";

import type {
  GeneratedDocument,
  ItemsResponse
} from "../types/Api";

export const fetchDocuments =
async (
  projectId?: string
) => {

  const query =
    projectId
      ? `?projectId=${encodeURIComponent(projectId)}`
      : "";

  const response =
    await api.get<
      ItemsResponse<GeneratedDocument>
    >(
      "/documents" +
      query
    );

  return response.data;

};
