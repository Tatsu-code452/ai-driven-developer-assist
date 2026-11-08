import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  fetchContexts
} from "../services/contextApi";

import {
  useProject
} from "../contexts/ProjectContext";

import type {
  Context
} from "../types/Api";

export const ContextListPage =
() => {

  const {
    project
  } = useProject();

  const [
    items,
    setItems
  ] = useState<Context[]>(
    []
  );

  useEffect(
    () => {

      if (
        !project
      ) {

        setItems(
          []
        );

        return;
      }

      fetchContexts(project.id)
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
        space-y-4
        rounded
        border
        bg-white
        p-6
        "
      >

        <h1
          className="
          text-3xl
          font-bold
          "
        >
          SCR-004
          コンテキスト一覧
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
          SCR-004
          コンテキスト一覧
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

            <th>状態</th>

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
                      to={
                        "/contexts/detail?id=" +
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
                    {item.status}
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
