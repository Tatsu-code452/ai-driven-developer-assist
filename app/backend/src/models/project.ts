import { DateTimeString, EntityId } from "@/models/models";

//
// Project
//

export type ProjectStatus = "PLANNING" |
    "ACTIVE" |
    "SUSPENDED" |
    "COMPLETED" |
    "ARCHIVED";

export type Project = {
    id: EntityId;
    name: string;
    description: string;
    status: ProjectStatus;
    rootPath: string;
    createdAt: DateTimeString;
    updatedAt: DateTimeString;
};
