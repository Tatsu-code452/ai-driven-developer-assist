import { api }
from "./api";

export const fetchIssues =
async (
  projectId?: string
) => {

  const query =
    projectId
      ? `?projectId=${encodeURIComponent(projectId)}`
      : "";

  const response =
    await api.get(
      "/issues" +
      query
    );

  return response.data;

};
