import {
  useEffect,
  useState
} from "react";

import {
  useSearchParams
} from "react-router-dom";

import {
  fetchContextDetail
} from "../services/contextApi";

export const ContextDetailPage =
() => {

  const [
    searchParams
  ] =
  useSearchParams();

  const id =
    searchParams.get(
      "id"
    );

  const [
    item,
    setItem
  ] =
  useState<any>();

  useEffect(
    () => {

      if (!id) {
        return;
      }

      fetchContextDetail(
        id
      ).then(
        result =>
          setItem(
            result.item
          )
      );

    },
    [id]
  );

  return (

    <div>

      <h1
        className="
        text-3xl
        font-bold
        mb-4
        "
      >
        SCR-005
        コンテキスト詳細
      </h1>

      <pre
        className="
        bg-white
        p-4
        border
        rounded
        "
      >
        {
          JSON.stringify(
            item,
            null,
            2
          )
        }
      </pre>

    </div>

  );

};
