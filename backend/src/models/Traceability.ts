export type Traceability = {

  sourceId: string;

  targetId: string;

  relationType:
    | "REQ-DES"
    | "DES-TSK"
    | "REQ-TSK";

};
