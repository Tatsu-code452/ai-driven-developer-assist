import {
  useEffect,
  useState
} from "react";

import {
  fetchDashboard
} from "../services/dashboardApi";

export const DashboardPage =
() => {

  const [
    data,
    setData
  ] = useState<any>();

  useEffect(
    () => {

      fetchDashboard()
        .then(
          setData
        );

    },
    []
  );

  return (

    <div
      className="
      space-y-6
      "
    >

      <h1
        className="
        text-3xl
        font-bold
        "
      >
        SCR-001
        ダッシュボード
      </h1>

      <div
        className="
        grid
        grid-cols-4
        gap-4
        "
      >

        <Card
          title="Task"
          value={
            data?.summary
              ?.taskCount ?? 0
          }
        />

        <Card
          title="Document"
          value={
            data?.summary
              ?.documentCount ?? 0
          }
        />

        <Card
          title="進捗"
          value={
            (data?.summary?.progress ?? 0)
            + "%"
          }
        />

        <Card
          title="完了"
          value={
            data?.summary
              ?.completedTaskCount ?? 0
          }
        />

      </div>

      <div
        className="
        grid
        grid-cols-2
        gap-4
        "
      >

        <section
          className="
          bg-white
          border
          rounded
          p-4
          "
        >

          <h2
            className="
            font-bold
            mb-3
            "
          >
            最新Task
          </h2>

          {
            data?.latestTasks?.map(
              (
                task: any
              ) => (

                <div
                  key={
                    task.id
                  }
                >
                  {task.id}
                  {" "}
                  {task.title}
                </div>

              )
            )
          }

        </section>

        <section
          className="
          bg-white
          border
          rounded
          p-4
          "
        >

          <h2
            className="
            font-bold
            mb-3
            "
          >
            最新Document
          </h2>

          {
            data?.latestDocuments?.map(
              (
                doc: any
              ) => (

                <div
                  key={
                    doc.id
                  }
                >
                  {doc.id}
                  {" "}
                  {doc.title}
                </div>

              )
            )
          }

        </section>

      </div>

    </div>

  );

};

const Card =
(
  props: any
) => (

  <div
    className="
    bg-white
    border
    rounded
    p-4
    "
  >

    <div>
      {props.title}
    </div>

    <div
      className="
      text-3xl
      font-bold
      "
    >
      {props.value}
    </div>

  </div>

);
