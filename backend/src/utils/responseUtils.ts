import type { Response } from "express";

const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

export const createResponse = (success: boolean, message?: string, item?: unknown) => {
    const response: Record<string, unknown> = { success };
    if (message) {
        response.message = message;
    }
    if (item) {
        response.item = item;
    }
    return response;
};

export const createSuccessResponse = (res: Response, item?: unknown) => {
    return res.json(createResponse(true, undefined, item));
}

export const createCreatedResponse = (res: Response, item?: unknown) => {
    return res.status(CREATED).json(createResponse(true, undefined, item));
}

export const createErrorResponse = (res: Response, message: string, errorCode: number) => {
    return res.status(errorCode).json(createResponse(false, message));
};

export const createBadRequestResponse = (res: Response, message: string): Response => {
    return createErrorResponse(res, message, BAD_REQUEST);
};

export const createNotFoundResponse = (res: Response, message: string): Response => {
    return createErrorResponse(res, message, NOT_FOUND);
};