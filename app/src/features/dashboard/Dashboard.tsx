/**
 * ダッシュボードコンポーネント
 */
export const Dashboard = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm text-gray-500">プロジェクト数</h2>
                    <p className="text-2xl font-bold">12</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm text-gray-500">進行中案件</h2>
                    <p className="text-2xl font-bold">5</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm text-gray-500">完了案件</h2>
                    <p className="text-2xl font-bold">7</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-sm text-gray-500">担当者数</h2>
                    <p className="text-2xl font-bold">18</p>
                </div>
            </div>
        </div>
    );
};
