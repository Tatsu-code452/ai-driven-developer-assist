import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

export const apiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    return error.message || fallback;
  }

  return error instanceof Error && error.message
    ? error.message
    : fallback;
};
