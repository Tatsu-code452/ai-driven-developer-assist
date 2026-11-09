import {
  useEffect,
  useState
} from "react";

import {
  useSearchParams
} from "react-router-dom";

import {
  useProject
} from "../contexts/ProjectContext";

import {
  fetchContextDetail
} from "../services/contextApi";

import type {
  Context
} from "../types/Api";

export const ContextDetailPage =
() => {

  const {
    project
  } = useProject();

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
  useState<Context | null>(null);

  useEffect(
    () => {

      if (
        !id ||
        !project
      ) {

        return;

      }

      fetchContextDetail(
        id,
        project.id
      ).then(
        result =>
          setItem(
            result.item
          )
      );

    },
    [
      id,
      project
    ]
  );

  if (
    !project
  ) {

    return (
      <p>
        プロジェクトが選択されていません
      </p>
    );

  }

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

      <div
        className="
        text-sm
        text-slate-500
        mb-2
        "
      >
        Project :
        {" "}
        {project.name}
      </div>

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
