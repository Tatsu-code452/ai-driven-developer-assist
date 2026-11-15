import axios from "axios";

const api =
  axios.create({
    baseURL:
      "http://localhost:3000/api"
  });

export const getProjects = async () => {

  const response =
    await api.get(
      "/projects"
    );

  return response.data;
}

export const setCurrentProject = async (
  id: string
) => {
  return api.put(
    `/projects/${id}/current`
  );
}

export const getProject = async (
  id: string
) => {

  const response =
    await api.get(
      `/projects/${id}`
    );

  return response.data;
}

export const updateProject = async (
  id: string,
  project: unknown
) => {

  const response =
    await api.put(
      `/projects/${id}`,
      project
    );

  return response.data;
}

export const deleteProject = async (
  id: string
) => {

  return api.delete(
    `/projects/${id}`
  );
}
