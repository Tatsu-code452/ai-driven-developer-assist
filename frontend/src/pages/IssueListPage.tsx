import { Link } from "react-router-dom";

import { useProject } from "../contexts/ProjectContext";

export const IssueListPage = () => {
    const { project } = useProject();

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
                <h1
                    className="
          text-3xl
          font-bold
          mb-4
          "
                >
                    SCR-017 課題一覧
                </h1>

                <p>プロジェクトが選択されていません。</p>

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
                <h1
                    className="
          text-3xl
          font-bold
          "
                >
                    SCR-017 課題一覧
                </h1>

                <div
                    className="
  text-sm
  text-slate-500
  mb-4
  "
                >
                    Project :{project?.name}
                </div>
            </div>

            <table
                className="
        w-full
        bg-white
        "
            >
                <tbody>
                    <tr>
                        <td>BUG-001</td>

                        <td>採番重複対応</td>

                        <td>OPEN</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
