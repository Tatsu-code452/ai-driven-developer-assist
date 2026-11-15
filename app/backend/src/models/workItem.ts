import { DateTimeString, EntityId } from "@/models/models";

//
// WorkItem
//

export type WorkItemType = "TASK" |
    "BUG" |
    "QA" |
    "REVIEW" |
    "FIX";

export type WorkItemStatus = "OPEN" |
    "TODO" |
    "DOING" |
    "DONE" |
    "CLOSED";

export type WorkItemPriority = "LOW" |
    "NORMAL" |
    "HIGH" |
    "CRITICAL";

export type WorkItem = {
    id: EntityId;

    projectId: EntityId;

    type: WorkItemType;

    title: string;

    description: string;

    status: WorkItemStatus;

    priority: WorkItemPriority;

    assignee?: string;

    parentId?: EntityId;

    createdAt: DateTimeString;

    updatedAt: DateTimeString;
};
