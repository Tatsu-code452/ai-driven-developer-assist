import {
  Link
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  useProject
} from "../contexts/ProjectContext";

import {
  fetchDocuments
} from "../services/documentApi";

import type {
  GeneratedDocument
} from "../types/Api";

export const DocumentListPage =
() => {

  const {
    project
  } = useProject();

  const [
    items,
    setItems
  ] = useState<
    GeneratedDocument[]
  >([]);

  useEffect(
    () => {

      if (
        !project
      ) {

        setItems([]);

        return;

      }

      fetchDocuments(
        project.id
      )
        .then(
          result =>
            setItems(
              result.items
            )
        );

    },
    [
      project
    ]
  );

  if (
    !project
  ) {

    return (

      <section
        className="
        bg-white
        border
        rounded
        p-6
        "
      >

        <h1
          className="
          text-3xl
          font-bold
          mb-4
          "
        >
          SCR-007
          ドキュメント一覧
        </h1>

        <p>
          プロジェクトが選択されていません。
        </p>

        <Link
          className="
          text-blue-700
          underline
          "
          to="/projects"
        >
          プロジェクト一覧へ
        </Link>

      </section>

    );

  }

  return (

    <div>

      <div
        className="
        mb-4
        "
      >

        <h1
          className="
          text-3xl
          font-bold
          "
        >
          SCR-007
          ドキュメント一覧
        </h1>

        <div
          className="
          text-sm
          text-slate-500
          "
        >
          Project :
          {" "}
          {project.name}
        </div>

      </div>

      <table
        className="
        w-full
        bg-white
        "
      >

        <thead>

          <tr>

            <th>ID</th>

            <th>タイトル</th>

            <th>種別</th>

          </tr>

        </thead>

        <tbody>

          {
            items.map(
              item => (

                <tr
                  key={item.id}
                >

                  <td>

                    <Link
                      className="
                      text-blue-600
                      "
                      to={
                        "/documents/detail?id=" +
                        item.id
                      }
                    >
                      {item.id}
                    </Link>

                  </td>

                  <td>
                    {item.title}
                  </td>

                  <td>
                    {item.type}
                  </td>

                </tr>

              )
            )
          }

        </tbody>

      </table>

    </div>

  );

};
