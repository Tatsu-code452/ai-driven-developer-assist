/**
 * メニューコンポーネント
 */
export const Menu = ({
    activeTab,
    setActiveTab,
}: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}) => {
    const menus = ["Dashboard", "Project"];

    return (
        <div className="flex flex-col text-sm">
            <h2 className="text-lg font-bold mb-6">Menu</h2>

            <nav className="flex flex-col gap-2">
                {menus.map((menu) => (
                    <button
                        key={menu}
                        onClick={() => setActiveTab(menu)}
                        className={`
                            text-left
                            px-3 py-2 rounded
                            transition-colors
                            ${
                                activeTab === menu
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-blue-200"
                            }
                        `}
                    >
                        {menu}
                    </button>
                ))}
            </nav>
        </div>
    );
};
