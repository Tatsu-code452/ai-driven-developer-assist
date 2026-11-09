import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  useProject
} from "../contexts/ProjectContext";

import {
  fetchTraceability
} from "../services/traceabilityApi";

import type {
  TraceabilityItem
} from "../types/Api";

export const TraceabilityPage = () => {

  const {
    project
  } = useProject();

  const [
    items,
    setItems
  ] =
  useState<
    TraceabilityItem[]
  >([]);

  useEffect(
    () => {

      if (
        !project
      ) {

        setItems([]);

        return;

      }

      fetchTraceability()
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
          SCR-015
          トレーサビリティ管理
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
          SCR-015
          トレーサビリティ管理
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
                    item.sourceId +
                    item.targetId
                  }
                >

                  <td>
                    {item.sourceId}
                  </td>

                  <td>
                    {item.targetId}
                  </td>

                  <td>
                    {item.relationType}
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
