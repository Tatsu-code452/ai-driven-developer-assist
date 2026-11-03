import { api }
from "./api";

export const fetchMatrix =
async () => {

  const response =
    await api.get(
      "/traceability/matrix"
    );

  return response.data;

};
