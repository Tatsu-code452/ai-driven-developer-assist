import { DateTimeString, EntityId } from "@/models/models";

//
// Artifact
//

export type ArtifactType = "REQUIREMENT" |
    "DESIGN" |
    "SCREEN" |
    "DATABASE" |
    "API" |
    "SOURCE" |
    "TEST" |
    "MANUAL" |
    "REVIEW" |
    "FIX" |
    "WBS" |
    "PROMPT";

export type ArtifactStatus = "DRAFT" |
    "REVIEWING" |
    "APPROVED" |
    "REJECTED" |
    "ARCHIVED";

export type Artifact = {
    id: EntityId;

    projectId: EntityId;

    workItemId?: EntityId;

    artifactType: ArtifactType;

    title: string;

    path: string;

    content?: string;

    version: string;

    status: ArtifactStatus;

    approved: boolean;

    createdAt: DateTimeString;

    updatedAt: DateTimeString;
};
