import { api }
from "./api";

export const fetchContexts =
async () => {

  const response =
    await api.get(
      "/contexts"
    );

  return response.data;

};

export const fetchContextDetail =
async (
  id: string
) => {

  const response =
    await api.get(
      "/contexts/" +
      id
    );

  return response.data;

};
