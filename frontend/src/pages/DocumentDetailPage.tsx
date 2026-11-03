import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useSearchParams
} from "react-router-dom";

import {
  fetchDocuments
} from "../services/documentApi";

export const DocumentDetailPage =
() => {

  const [
    searchParams
  ] = useSearchParams();

  const documentId =
    searchParams.get("id");

  const [
    documents,
    setDocuments
  ] = useState<any[]>(
    []
  );

  useEffect(
    () => {

      fetchDocuments()
        .then(
          result =>
            setDocuments(
              result.items
            )
        );

    },
    []
  );

  const document =
    useMemo(
      () =>
        documents.find(
          item =>
            item.id ===
            documentId
        ),
      [
        documents,
        documentId
      ]
    );

  if (!document) {

    return (

      <div
        className="
        bg-white
        border
        rounded
        p-6
        "
      >

        ドキュメントが見つかりません

      </div>

    );

  }

  return (

    <div
      className="
      space-y-4
      "
    >

      <h1
        className="
        text-3xl
        font-bold
        "
      >
        SCR-008
        ドキュメント詳細
      </h1>

      <div
        className="
        bg-white
        border
        rounded
        p-6
        "
      >

        <dl
          className="
          grid
          grid-cols-2
          gap-4
          "
        >

          <dt>ID</dt>
          <dd>{document.id}</dd>

          <dt>タイトル</dt>
          <dd>{document.title}</dd>

          <dt>種別</dt>
          <dd>{document.type}</dd>

          <dt>ファイル</dt>
          <dd>{document.path}</dd>

          <dt>ソース</dt>
          <dd>{document.source}</dd>

        </dl>

      </div>

    </div>

  );

};
