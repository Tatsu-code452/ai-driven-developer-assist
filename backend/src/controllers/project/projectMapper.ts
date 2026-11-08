import type { Document } from "@/models/Document";
import type {
    ProjectInput,
    ProjectRecord,
} from "@/models/Project";
import type { Task } from "@/models/Task";
import { isStringProperty } from "@/utils/propUtils";
import { isObject } from "@/utils/typeUtils";

export const isProjectInput = (
    value: unknown,
): value is ProjectInput =>
    isObject(value) &&
    isStringProperty(value, "name") &&
    (
        value.description === undefined ||
        isStringProperty(value, "description")
    ) &&
    (
        value.status === undefined ||
        isStringProperty(value, "status")
    ) &&
    (
        value.rootPath === undefined ||
        isStringProperty(value, "rootPath")
    );

export const projectInputFrom = (
    body: unknown,
): ProjectInput | undefined => {
    if (!isProjectInput(body)) {
        return undefined;
    }

    const name = body.name.trim();

    if (!name) {
        return undefined;
    }

    return {
        name,
        description: body.description ?? "",
        status: body.status ?? "",
        rootPath: body.rootPath ?? "",
    };
};

export const toProjectResponse = (
    project: ProjectRecord,
    taskMap: Map<string, Task[]>,
    documentMap: Map<string, Document[]>,
) => ({
    ...project,
    taskCount:
        taskMap.get(project.id)?.length ?? 0,
    documentCount:
        documentMap.get(project.id)?.length ?? 0,
});