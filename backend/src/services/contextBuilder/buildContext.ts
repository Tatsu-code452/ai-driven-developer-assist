import type {
  Context
} from "@/models/Context";

export const buildContext =
(
  id: string,
  title: string,
  type: string,
  taskIds: string[],
  documentIds: string[]
): Context => {

  const now =
    new Date()
      .toISOString();

  return {

    id,

    title,

    description:
      title,

    type,

    status:
      "ACTIVE",

    taskIds,

    documentIds,

    issueIds: [],

    qaIds: [],

    createdAt:
      now,

    updatedAt:
      now

  };

};
