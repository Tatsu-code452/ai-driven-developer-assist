import { api } from "./api";

export const fetchDocuments =
  async () => {

    const response =
      await api.get(
        "/documents"
      );

    return response.data;
  };
