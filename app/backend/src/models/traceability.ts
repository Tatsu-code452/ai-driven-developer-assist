import { EntityId } from "@/models/models";

//
// Traceability
//

export type TraceabilityRelationType = "INPUT" |
    "OUTPUT" |
    "DERIVED_FROM" |
    "IMPLEMENTS" |
    "VALIDATES" |
    "REVIEWS" |
    "FIXES";

export type Traceability = {
    id: EntityId;

    projectId: EntityId;

    sourceType: string;

    sourceId: EntityId;

    targetType: string;

    targetId: EntityId;

    relationType: TraceabilityRelationType;
};
