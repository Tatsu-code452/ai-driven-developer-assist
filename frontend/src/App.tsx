import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";

import { ConverterPage } from "./pages/ConverterPage";

import { PlaceholderPage } from "./pages/common/PlaceholderPage";

import { DashboardPage } from "./pages/DashboardPage";

import { ProjectListPage } from "./pages/ProjectListPage";

import { DocumentListPage } from "./pages/DocumentListPage";

import { TaskListPage } from "./pages/TaskListPage";

import { screens } from "./config/screens";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    {/* ホーム */}
                    <Route path="/" element={<DashboardPage />} />

                    {/* SCR-001 */}
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* SCR-002 */}
                    <Route path="/projects" element={<ProjectListPage />} />

                    {/* SCR-007 */}
                    <Route path="/documents" element={<DocumentListPage />} />

                    <Route
                        path="/documents/detail"
                        element={<DocumentDetailPage />}
                    />

                    {/* SCR-021 */}
                    <Route path="/tasks" element={<TaskListPage />} />

                    <Route path="/tasks/detail" element={<TaskDetailPage />} />

                    {/* SCR-025 */}
                    <Route path="/converter" element={<ConverterPage />} />

                    {screens.map((screen) => {
                        const [screenId, title, route] = screen;

                        const implemented = [
                            "SCR-001",
                            "SCR-002",
                            "SCR-007",
                            "SCR-008",
                            "SCR-021",
                            "SCR-022",
                            "SCR-025",
                        ];

                        if (implemented.includes(screenId)) {
                            return null;
                        }

                        return (
                            <Route
                                key={screenId}
                                path={route}
                                element={
                                    <PlaceholderPage
                                        screenId={screenId}
                                        title={title}
                                    />
                                }
                            />
                        );
                    })}
                </Route>
            </Routes>
        </BrowserRouter>
    );
};
