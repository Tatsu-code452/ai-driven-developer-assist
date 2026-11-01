type Props = {
  taskCount: number;
  documentCount: number;
};

export const SummaryPanel = (
  props: Props
) => {

  return (

    <div
      className="
      grid
      grid-cols-2
      gap-4
      "
    >

      <div
        className="
        p-4
        bg-blue-50
        rounded
        border
        "
      >
        <div
          className="
          text-sm
          text-slate-500
          "
        >
          Task
        </div>

        <div
          className="
          text-3xl
          font-bold
          "
        >
          {props.taskCount}
        </div>

      </div>

      <div
        className="
        p-4
        bg-green-50
        rounded
        border
        "
      >
        <div
          className="
          text-sm
          text-slate-500
          "
        >
          Document
        </div>

        <div
          className="
          text-3xl
          font-bold
          "
        >
          {props.documentCount}
        </div>

      </div>

    </div>

  );

};
