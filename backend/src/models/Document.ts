export type DocumentType =
  | "REQ"
  | "DES"
  | "DET"
  | "TST"
  | "OPS"
  | "DOC";

export type Document = {
  id: string;
  title: string;
  type: DocumentType;
  path: string;
  source: string;
  projectId?: string;
};
