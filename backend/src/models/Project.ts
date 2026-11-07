export type ProjectRecord = {
  id: string;
  name: string;
  description: string;
  status: string;
};

export type ProjectInput = Omit<ProjectRecord, "id">;
