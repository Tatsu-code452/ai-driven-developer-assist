import { Request, Response } from "express";

import {
  loadDocuments
} from "@/repositories/DocumentRepository";

export const getDocuments =
(
  _req: Request,
  res: Response
) => {

  const documents =
    loadDocuments(
      "data/generated"
    );

  return res.json({

    success: true,

    items: documents,

    count:
      documents.length

  });

};
