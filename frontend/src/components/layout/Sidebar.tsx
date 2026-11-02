import {
  NavLink
} from "react-router-dom";

import {
  screens
} from "../../config/screens";

export const Sidebar =
() => {

  return (

    <aside
      className="
      w-72
      border-r
      bg-white
      overflow-auto
      "
    >

      <div
        className="
        p-4
        font-bold
        border-b
        "
      >
        Menu
      </div>

      <nav
        className="p-2"
      >

        {
          screens.map(
            screen => (

              <NavLink
                key={screen[0]}
                to={screen[2]}
                className="
                block
                p-2
                rounded
                hover:bg-slate-100
                text-sm
                "
              >
                {screen[0]}
                <br />
                {screen[1]}
              </NavLink>

            )
          )
        }

      </nav>

    </aside>

  );

};
