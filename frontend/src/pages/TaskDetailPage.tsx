import {
  useMemo
} from "react";

import {
  useSearchParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  fetchTasks
} from "../services/taskApi";
import type { Task } from "../types/Api";

export const TaskDetailPage =
() => {

  const [
    searchParams
  ] = useSearchParams();

  const taskId =
    searchParams.get("id");

  const [
    tasks,
    setTasks
  ] = useState<Task[]>(
    []
  );

  useEffect(
    () => {

      fetchTasks()
        .then(
          result =>
            setTasks(
              result.items
            )
        );

    },
    []
  );

  const task =
    useMemo(
      () =>
        tasks.find(
          item =>
            item.id === taskId
        ),
      [
        tasks,
        taskId
      ]
    );

  if (!task) {

    return (

      <div
        className="
        bg-white
        border
        rounded
        p-6
        "
      >

        タスクが見つかりません

      </div>

    );

  }

  return (

    <div
      className="
      space-y-4
      "
    >

      <h1
        className="
        text-3xl
        font-bold
        "
      >
        SCR-022
        タスク詳細
      </h1>

      <div
        className="
        bg-white
        border
        rounded
        p-6
        "
      >

        <dl
          className="
          grid
          grid-cols-2
          gap-4
          "
        >

          <dt>ID</dt>
          <dd>{task.id}</dd>

          <dt>タイトル</dt>
          <dd>{task.title}</dd>

          <dt>状態</dt>
          <dd>{task.status}</dd>

          <dt>優先度</dt>
          <dd>{task.priority}</dd>

          <dt>ソース</dt>
          <dd>{task.source}</dd>

        </dl>

      </div>

    </div>

  );

};
