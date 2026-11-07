import { api } from "./api";
import type { ItemsResponse, Task } from "../types/Api";

export const fetchTasks =
  async () => {

    const response =
      await api.get<ItemsResponse<Task>>(
        "/tasks"
      );

    return response.data;
  };
