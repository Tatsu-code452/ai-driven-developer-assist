import { NavLink, Outlet } from "react-router-dom";

import { screens } from "../config/screens";
import { useProject } from "../contexts/ProjectContext";

export const AppLayout = () => {
    const { project } = useProject();

    return (
        <div
            className="
      h-screen
      flex
      "
        >
            <aside
                className="
        w-80
        bg-white
        border-r
        overflow-auto
        "
            >
                <div
                    className="
          p-4
          font-bold
          text-lg
          border-b
          "
                >
                    AI駆動型開発支援
                </div>
                {project && (
                    <div
                        className="
      p-3
      border-b
      bg-blue-50
      text-sm
      "
                    >
                        <div>選択中プロジェクト</div>

                        <div
                            className="
        font-bold
        "
                        >
                            {project.name}
                        </div>

                        <div
                            className="
        text-xs
        text-slate-500
        break-all
        "
                        >
                            {project.rootPath}
                        </div>
                    </div>
                )}

                {screens.map((screen) => (
                    <NavLink
                        key={screen[0]}
                        to={screen[2]}
                        className="
                block
                px-3
                py-2
                border-b
                hover:bg-slate-100
                "
                    >
                        <div
                            className="
                  text-xs
                  text-slate-500
                  "
                        >
                            {screen[0]}
                        </div>

                        <div>{screen[1]}</div>
                    </NavLink>
                ))}
            </aside>

            <main
                className="
        flex-1
        overflow-auto
        p-6
        bg-slate-100
        "
            >
                <Outlet />
            </main>
        </div>
    );
};
