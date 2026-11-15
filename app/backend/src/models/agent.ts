import { EntityId } from "@/models/models";

//
// Agent
//

export type AgentType = "ROUTER" |
    "PM" |
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
    "DOC" |
    "KNOWLEDGE";

export type Agent = {
    id: EntityId;

    name: string;

    type: AgentType;

    enabled: boolean;

    description: string;
};
