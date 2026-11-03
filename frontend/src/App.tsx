import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";

import { ConverterPage } from "./pages/ConverterPage";

import { PlaceholderPage } from "./pages/common/PlaceholderPage";

import { DashboardPage } from "./pages/DashboardPage";

import { ProjectListPage } from "./pages/ProjectListPage";

import { DocumentListPage } from "./pages/DocumentListPage";

import { TaskListPage } from "./pages/TaskListPage";

import { screens } from "./config/screens";
import { ContextCreatePage } from "./pages/ContextCreatePage";
import { ContextDetailPage } from "./pages/ContextDetailPage";
import { ContextListPage } from "./pages/ContextListPage";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import { IssueListPage } from "./pages/IssueListPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { QAListPage } from "./pages/QAListPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { TraceabilityMatrixPage } from "./pages/TraceabilityMatrixPage";
import { TraceabilityPage } from "./pages/TraceabilityPage";

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

                    {/* SCR-003 */}
                    <Route
                        path="/projects/detail"
                        element={<ProjectDetailPage />}
                    />

                    {/* SCR-004 */}
                    <Route path="/contexts" element={<ContextListPage />} />

                    {/* SCR-005 */}
                    <Route
                        path="/contexts/detail"
                        element={<ContextDetailPage />}
                    />

                    {/* SCR-006 */}
                    <Route
                        path="/contexts/create"
                        element={<ContextCreatePage />}
                    />

                    {/* SCR-007 */}
                    <Route path="/documents" element={<DocumentListPage />} />

                    {/* SCR-008 */}
                    <Route
                        path="/documents/detail"
                        element={<DocumentDetailPage />}
                    />

                    {/* SCR-015 */}
                    <Route
                        path="/traceability"
                        element={<TraceabilityPage />}
                    />

                    {/* SCR-016 */}
                    <Route
                        path="/traceability/matrix"
                        element={<TraceabilityMatrixPage />}
                    />

                    {/* SCR-017 */}
                    <Route path="/issues" element={<IssueListPage />} />

                    {/* SCR-019 */}
                    <Route path="/qa" element={<QAListPage />} />

                    {/* SCR-021 */}
                    <Route path="/tasks" element={<TaskListPage />} />

                    {/* SCR-022 */}
                    <Route path="/tasks/detail" element={<TaskDetailPage />} />

                    {/* SCR-025 */}
                    <Route path="/converter" element={<ConverterPage />} />

                    {screens.map((screen) => {
                        const [screenId, title, route] = screen;

                        const implemented = [
                            "SCR-001",
                            "SCR-002",
                            "SCR-003",
                            "SCR-004",
                            "SCR-005",
                            "SCR-006",
                            "SCR-007",
                            "SCR-008",
                            "SCR-015",
                            "SCR-016",
                            "SCR-017",
                            "SCR-019",
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
