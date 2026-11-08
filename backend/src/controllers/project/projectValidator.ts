import type { Request, Response } from "express";

import { projectInputFrom } from "@/controllers/project/projectMapper";
import type { ProjectInput } from "@/models/Project";
import { convertToPositiveIntegerOrDefault } from "@/utils/numberUtils";
import { createBadRequestResponse } from "@/utils/responseUtils";
import { isString } from "@/utils/typeUtils";

type QueryParams = {
    q?: string;
    status?: string;
};

export type ValidationContext = {
    id?: string;
    input?: ProjectInput;
    query?: QueryParams;
    requestedPage?: number;
};

export type Validator = (
    req: Request,
    res: Response,
    context: ValidationContext,
) => Response | undefined;

export const validate = (
    req: Request,
    res: Response,
    context: ValidationContext,
    validators: Validator[],
): Response | undefined => {
    for (const validator of validators) {
        const result = validator(
            req,
            res,
            context,
        );

        if (result) {
            return result;
        }
    }

    return undefined;
};

export const validateProjectId: Validator = (
    req,
    res,
    context,
) => {
    const id = req.params.id;

    if (!isString(id)) {
        return createBadRequestResponse(
            res,
            "プロジェクトIDを指定してください",
        );
    }

    context.id = id;
};

export const validateProjectInput: Validator = (
    req,
    res,
    context,
) => {
    const input =
        projectInputFrom(req.body);

    if (!input) {
        return createBadRequestResponse(
            res,
            "名称は必須です。説明と状態は文字列で指定してください",
        );
    }

    context.input = input;
};

export const hasProjectId = (
    context: ValidationContext,
): context is ValidationContext & {
    id: string;
} =>
    context.id !== undefined;

export const hasProjectInput = (
    context: ValidationContext,
): context is ValidationContext & {
    input: ProjectInput;
} =>
    context.input !== undefined;

export const validatePageQueryParam: Validator = (
    req: Request,
    res: Response,
    context: ValidationContext,
) => {
    const requestedPage = convertToPositiveIntegerOrDefault(req.query.page, 1);
    if (requestedPage === undefined) {
        return createBadRequestResponse(
            res,
            "ページ番号は正の整数で指定してください",
        );
    }

    context.requestedPage = requestedPage;

    if (
        (req.query.q !== undefined &&
            !isString(req.query.q)) ||
        (req.query.status !== undefined &&
            !isString(req.query.status))
    ) {
        return createBadRequestResponse(
            res,
            "検索条件は文字列で指定してください",
        );
    }

    context.query = {
        q: req.query.q ?? "",
        status: req.query.status ?? ""
    };
}