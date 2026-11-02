import {
  useEffect,
  useState
} from "react";

import {
  fetchDocuments
} from "../services/documentApi";

export const DocumentListPage =
() => {

  const [
    items,
    setItems
  ] = useState<any[]>(
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
                    {item.id}
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
