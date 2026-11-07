import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

export const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? error.message;
  }

  return error instanceof Error ? error.message : fallback;
};
