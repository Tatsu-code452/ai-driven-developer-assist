import { api }
from "./api";

export const fetchTraceability =
async () => {

  const response =
    await api.get(
      "/traceability"
    );

  return response.data;

};
