import type { Task } from "../../types/ConverterResult";

type Props = {
    tasks: Task[];
};

export const TaskTable = (props: Props) => {
    return (
        <table
            className="
      w-full
      border
      text-sm
      "
        >
            <thead>
                <tr
                    className="
          bg-slate-100
          "
                >
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                {props.tasks.map((task) => (
                    <tr key={task.id}>
                        <td>{task.id}</td>

                        <td>{task.title}</td>

                        <td>{task.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
