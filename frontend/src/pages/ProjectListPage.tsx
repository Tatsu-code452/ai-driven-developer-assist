import {
  useEffect,
  useState
} from "react";

import {
  fetchProjects
} from "../services/projectApi";

export const ProjectListPage =
() => {

  const [
    items,
    setItems
  ] = useState<any[]>(
    []
  );

  useEffect(
    () => {

      fetchProjects()
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
        SCR-002
        プロジェクト一覧
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

            <th>名称</th>

            <th>Task</th>

            <th>Document</th>

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
                    {item.name}
                  </td>

                  <td>
                    {
                      item.taskCount
                    }
                  </td>

                  <td>
                    {
                      item.documentCount
                    }
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
