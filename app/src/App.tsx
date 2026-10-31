import { useState } from "react";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Menu } from "./features/menu/Menu";
import { Project } from "./features/project/Project";

export const App = () => {
    const [activeTab, setActiveTab] = useState("Dashboard");

    return (
        <div className="flex min-h-screen font-sans text-gray-800">
            <aside className="w-52 bg-slate-800 text-white">
                <div className="p-4 border-b border-slate-700">
                    <h1 className="text-xl font-bold">
                        AI駆動型開発
                        <br />
                        支援システム
                    </h1>
                </div>

                <div className="p-4">
                    <Menu activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </aside>
            <main className="flex-1 bg-gray-100 p-6">
                {activeTab === "Dashboard" && <Dashboard />}

                {activeTab === "Project" && <Project />}
            </main>
        </div>
    );
};
