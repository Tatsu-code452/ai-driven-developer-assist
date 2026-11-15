import { DateTimeString, EntityId } from "@/models/models";

//
// Review
//

export type ReviewResult = "APPROVED" |
    "REQUEST_CHANGE";

export type Review = {
    id: EntityId;

    projectId: EntityId;

    workItemId: EntityId;

    reviewer: string;

    result: ReviewResult;

    comment: string;

    createdAt: DateTimeString;
};
