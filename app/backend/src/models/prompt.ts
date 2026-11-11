import { DateTimeString, EntityId } from "@/models/models";

//
// Prompt
//

export type PromptRole = "PM" |
    "REQ" |
    "ARCH" |
    "DB" |
    "UI" |
    "DES" |
    "BE" |
    "FE" |
    "TEST" |
    "REVIEW" |
    "FIX" |
    "TRACE" |
    "DOC";

export type Prompt = {
    id: EntityId;

    projectId: EntityId;

    name: string;

    role: PromptRole;

    template: string;

    outputFormat: string;

    version: string;

    createdAt: DateTimeString;

    updatedAt: DateTimeString;
};
