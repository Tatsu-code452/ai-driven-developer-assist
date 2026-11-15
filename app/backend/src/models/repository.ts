import { EntityId } from "@/models/models";

//
// Repository
//

export type RepositoryType = "GITHUB" |
    "AZURE_DEVOPS" |
    "GITLAB" |
    "LOCAL";

export type Repository = {
    id: EntityId;

    projectId: EntityId;

    url: string;

    type: RepositoryType;

    defaultBranch: string;

    currentBranch: string;

    worktreeRoot: string;
};
