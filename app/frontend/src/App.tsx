import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { ProjectCreatePage } from "./pages/projects/ProjectCreatePage";
import { ProjectDetailPage } from "./pages/projects/ProjectDetailPage";
import { ProjectListPage } from "./pages/projects/ProjectListPage";

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage />} />

                    <Route path="/projects" element={<ProjectListPage />} />
                    <Route
                        path="/projects/new"
                        element={<ProjectCreatePage />}
                    />

                    <Route
                        path="/projects/:id"
                        element={<ProjectDetailPage />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};
