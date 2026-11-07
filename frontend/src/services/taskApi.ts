import { api } from "./api";
import type {
  ItemResponse,
  Task,
  TaskInput,
  TaskListFilters,
  TaskListResponse,
} from "../types/Api";

export const fetchTasks = async (filters: TaskListFilters = {}) => {
  const response = await api.get<TaskListResponse>("/tasks", {
    params: filters,
  });
  return response.data;
};

export const fetchTask = async (id: string) => {
  const response = await api.get<ItemResponse<Task>>(
    `/tasks/${encodeURIComponent(id)}`,
  );
  return response.data.item;
};

export const createTask = async (input: TaskInput) => {
  const response = await api.post<ItemResponse<Task>>("/tasks", input);
  return response.data.item;
};

export const updateTask = async (id: string, input: TaskInput) => {
  const response = await api.put<ItemResponse<Task>>(
    `/tasks/${encodeURIComponent(id)}`,
    input,
  );
  return response.data.item;
};
