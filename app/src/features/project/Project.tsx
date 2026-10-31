/**
 * プロジェクト画面
 */
export const Project = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Project</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left">ID</th>
                            <th className="px-4 py-3 text-left">
                                プロジェクト名
                            </th>
                            <th className="px-4 py-3 text-left">状態</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr className="border-t">
                            <td className="px-4 py-3">P001</td>
                            <td className="px-4 py-3">販売管理システム</td>
                            <td className="px-4 py-3">進行中</td>
                        </tr>

                        <tr className="border-t">
                            <td className="px-4 py-3">P002</td>
                            <td className="px-4 py-3">在庫管理システム</td>
                            <td className="px-4 py-3">完了</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
