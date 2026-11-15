export type IssueStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED";

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  projectId?: string;
};

export type IssueInput = {
  title: string;
  description: string;
  status: IssueStatus;
  projectId: string;
};
