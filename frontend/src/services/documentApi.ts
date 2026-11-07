import { api } from "./api";
import type { GeneratedDocument, ItemsResponse } from "../types/Api";

export const fetchDocuments =
  async () => {

    const response =
      await api.get<ItemsResponse<GeneratedDocument>>(
        "/documents"
      );

    return response.data;
  };
