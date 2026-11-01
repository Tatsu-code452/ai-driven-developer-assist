import { api } from "./api";

export const convertMarkdown = async (
  content: string
) => {

  const response =
    await api.post(
      "/converter/markdown",
      { content }
    );

  return response.data;
};
