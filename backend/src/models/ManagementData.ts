export type ManagementDataItem = {
  title: string;
  /** 管理データパス(rootPath)からの相対パス。区切りは`/`。 */
  path: string;
  exists: boolean;
};

export type ManagementDataIndexStatus =
  | "ok"
  | "root-path-not-set"
  | "root-path-not-found"
  | "readme-not-found"
  | "section-not-found";

export type ManagementDataIndex = {
  status: ManagementDataIndexStatus;
  message: string;
  rootPath: string;
  items: ManagementDataItem[];
};
