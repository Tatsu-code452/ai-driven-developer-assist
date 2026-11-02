import {
  useEffect,
  useState
} from "react";

import {
  fetchTasks
} from "../services/taskApi";

export const TaskListPage =
() => {

  const [
    items,
    setItems
  ] = useState<any[]>(
    []
  );

  useEffect(
    () => {

      fetchTasks()
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
        SCR-021
        タスク一覧
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

            <th>優先度</th>

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
                    {item.status}
                  </td>

                  <td>
                    {item.priority}
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
