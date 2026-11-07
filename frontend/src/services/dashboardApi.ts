import { api } from "./api";
import type { DashboardData } from "../types/Api";

export const fetchDashboard =
  async () => {

    const response =
      await api.get<DashboardData>(
        "/dashboard"
      );

    return response.data;
  };
