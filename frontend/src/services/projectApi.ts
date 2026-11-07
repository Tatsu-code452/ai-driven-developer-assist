import { api } from "./api";
import type {
    ItemResponse,
    PagedItemsResponse,
    Project,
    ProjectInput,
} from "../types/Api";

export type ProjectListQuery = {
    q: string;
    status: string;
    page: number;
};

export const fetchProjects = async (query: ProjectListQuery) => {
    const response = await api.get<PagedItemsResponse<Project>>("/projects", {
        params: query,
    });

    return response.data;
};

export const fetchProject = async (id: string) => {
    const response = await api.get<ItemResponse<Project>>(
        `/projects/${encodeURIComponent(id)}`,
    );
    return response.data.item;
};

export const createProject = async (input: ProjectInput) => {
    const response = await api.post<ItemResponse<Project>>("/projects", input);
    return response.data.item;
};

export const updateProject = async (id: string, input: ProjectInput) => {
    const response = await api.put<ItemResponse<Project>>(
        `/projects/${encodeURIComponent(id)}`,
        input,
    );
    return response.data.item;
};
