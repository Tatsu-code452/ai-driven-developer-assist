import { api } from "./api";
import type { ItemsResponse, Project } from "../types/Api";

export const fetchProjects =
  async () => {

    const response =
      await api.get<ItemsResponse<Project>>(
        "/projects"
      );

    return response.data;
  };
