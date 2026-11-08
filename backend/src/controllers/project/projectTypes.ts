import type { Request, Response } from "express";

export type ApiMethod = (
    req: Request,
    res: Response,
) => Response | undefined;

export const DATA_DIRECTORY = "data/generated";
export const PAGE_SIZE = 20;
