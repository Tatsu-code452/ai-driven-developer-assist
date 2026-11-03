export type Context = {

  id: string;

  title: string;

  type: string;

  description: string;

  status:
    | "ACTIVE"
    | "ARCHIVED";

  documentIds: string[];

  taskIds: string[];

  issueIds: string[];

  qaIds: string[];

  createdAt: string;

  updatedAt: string;

};
