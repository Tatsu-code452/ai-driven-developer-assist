import type {
    ItemResponse,
    PagedItemsResponse,
    Project,
    ProjectInput,
} from "../types/Api";
import { api } from "./api";

export type ProjectListQuery = {
    q: string;
    status: string;
    page: number;
};

export const fetchProjects = async (query: ProjectListQuery) => {
    const response = await api.get<
        PagedItemsResponse<Project> | { success: boolean; item: PagedItemsResponse<Project> }
    >("/projects", {
        params: query,
    });

    const data = response.data;
    if ("item" in data && data.item && typeof data.item === "object" && "items" in data.item) {
        return data.item as PagedItemsResponse<Project>;
    }

    return data as PagedItemsResponse<Project>;
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
