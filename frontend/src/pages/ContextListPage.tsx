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
import type { Context } from "../types/Api";

export const ContextListPage =
() => {

  const [
    items,
    setItems
  ] = useState<Context[]>(
    []
  );

  useEffect(
    () => {

      fetchContexts()
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
        SCR-004
        コンテキスト一覧
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
