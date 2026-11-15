import { DateTimeString, EntityId } from "@/models/models";

//
// AI Execution
//

export type AIProvider = "COPILOT" |
    "GITHUB_COPILOT" |
    "GEMINI";

export type AIExecutionStatus = "RUNNING" |
    "SUCCESS" |
    "FAILED" |
    "CANCELED";

export type AIExecution = {
    id: EntityId;

    projectId: EntityId;

    workItemId: EntityId;

    promptId: EntityId;

    contextIds: EntityId[];

    aiType: AIProvider;

    requestText: string;

    responseText: string;

    status: AIExecutionStatus;

    executedAt: DateTimeString;
};
