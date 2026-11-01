import { Outlet } from "react-router-dom";

export const AppLayout = () => {

  return (

    <div
      className="
      min-h-screen
      bg-slate-100
      "
    >

      <header
        className="
        bg-slate-900
        text-white
        px-6
        py-4
        text-xl
        font-bold
        "
      >
        AI駆動型開発支援
      </header>

      <main
        className="p-6"
      >
        <Outlet />
      </main>

    </div>

  );

};
