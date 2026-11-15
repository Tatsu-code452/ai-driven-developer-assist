import { DateTimeString, EntityId } from "@/models/models";

//
// Context
//

export type ContextType = "REQUIREMENT" |
    "DESIGN" |
    "TEST" |
    "SOURCE" |
    "PROJECT" |
    "KNOWLEDGE";

export type Context = {
    id: EntityId;
    projectId: EntityId;

    title: string;
    type: ContextType;

    content: string;

    sourceArtifactIds: EntityId[];

    tags: string[];

    createdAt: DateTimeString;
    updatedAt: DateTimeString;
};
