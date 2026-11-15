import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  useProject
} from "../contexts/ProjectContext";

import {
  fetchMatrix
} from "../services/matrixApi";

import type {
  TraceabilityMatrixItem
} from "../types/Api";

export const TraceabilityMatrixPage =
() => {

  const {
    project
  } = useProject();

  const [
    items,
    setItems
  ] = useState<
    TraceabilityMatrixItem[]
  >([]);

  useEffect(
    () => {

      if (
        !project
      ) {

        setItems([]);

        return;

      }

      fetchMatrix()
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

  if (!project) {

    return (

      <section
        className="
        bg-white
        border
        rounded
        p-6
        "
      >

        <h1>
          SCR-016
          トレーサビリティマトリクス
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

        <h1>
          SCR-016
          トレーサビリティマトリクス
        </h1>

        <div
          className="
          text-sm
          text-slate-500
          "
        >
          Project :
          {project.name}
        </div>

      </div>

      <table>

        <thead>

          <tr>

            <th>
              Source
            </th>

            <th>
              Target
            </th>

            <th>
              Relation
            </th>

          </tr>

        </thead>

        <tbody>

          {

            items.map(
              item => (

                <tr
                  key={
                    item.source +
                    item.target
                  }
                >

                  <td>
                    {item.source}
                  </td>

                  <td>
                    {item.target}
                  </td>

                  <td>
                    {item.relation}
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
