import {
  Link
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  fetchDocuments
} from "../services/documentApi";
import type { GeneratedDocument } from "../types/Api";

export const DocumentListPage =
() => {

  const [
    items,
    setItems
  ] = useState<GeneratedDocument[]>(
    []
  );

  useEffect(
    () => {

      fetchDocuments()
        .then(
          result =>
            setItems(
              result.items
            )
        );

    },
    []
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
        SCR-007
        ドキュメント一覧
      </h1>

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
