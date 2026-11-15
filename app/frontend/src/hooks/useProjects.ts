import {
  useEffect,
  useState
} from "react";

import {
  getProjects
} from "../api/projectApi";
import type { Project } from "../types/Project";


export const useProjects = () => {

  const [
    projects,
    setProjects
  ] =
    useState<Project[]>([]);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  useEffect(() => {

    getProjects()
      .then(result => {

        setProjects(
          result.items ?? []
        );

      })
      .finally(() => {

        setLoading(false);

      });

  }, []);

  return {
    projects,
    loading
  };
}
