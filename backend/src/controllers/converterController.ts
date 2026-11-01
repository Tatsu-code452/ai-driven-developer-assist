import { parseMarkdownContent } from "@/services/markdownParser/parseMarkdownContent";
import { Request, Response } from "express";

export const convertMarkdown = (
  req: Request,
  res: Response
) => {

  const content = req.body.content;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: "content is required"
    });
  }

  const document = parseMarkdownContent(content);

  return res.json({
    success: true,
    data: document
  });
};
