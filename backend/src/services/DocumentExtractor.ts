import type { Document } from "../models/Document";
import type { DocumentModel } from "../models/DocumentModel";

type Options = {
  nextId?: () => string;
};

export const extractDocuments = (
  document: DocumentModel,
  options?: Options
): Document[] => {

  const type =
    detectDocumentType(
      document
    );

  return [

    {
      id:
        options?.nextId
          ? options.nextId()
          : createDocumentId(
            type,
            1
          ),

      title:
        document.title,

      type,

      path:
        document.fileName,

      source:
        document.title
    }

  ];

};

export const detectDocumentType =
  (
    document: DocumentModel
  ) => {

    const title =
      document.title
        .toLowerCase();

    const fileName =
      document.fileName
        .toLowerCase();

    const value =
      title + " " +
      fileName;

    if (
      value.includes("要件") ||
      value.includes(
        "requirements"
      )
    ) {
      return "REQ";
    }

    if (
      value.includes(
        "基本設計"
      ) ||
      value.includes(
        "アーキテクチャ"
      ) ||
      value.includes(
        "design"
      )
    ) {
      return "DES";
    }

    if (
      value.includes(
        "詳細設計"
      )
    ) {
      return "DET";
    }

    if (
      value.includes(
        "テスト"
      )
    ) {
      return "TST";
    }

    if (
      value.includes(
        "運用"
      )
    ) {
      return "OPS";
    }

    return "DOC";
  };

export const createDocumentId =
  (
    prefix: string,
    sequence: number
  ): string => {

    return (
      prefix +
      "-" +
      String(
        sequence
      ).padStart(
        3,
        "0"
      )
    );
  };
