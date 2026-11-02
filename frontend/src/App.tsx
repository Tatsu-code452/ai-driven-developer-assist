import {
  BrowserRouter,
  Route,
  Routes
} from "react-router-dom";

import {
  AppLayout
} from "./layouts/AppLayout";

import {
  ConverterPage
} from "./pages/ConverterPage";

import {
  PlaceholderPage
} from "./pages/common/PlaceholderPage";

import {
  screens
} from "./config/screens";

export const App = () => {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          element={
            <AppLayout />
          }
        >

          <Route
            path="/"
            element={
              <PlaceholderPage
                screenId="SCR-001"
                title="ダッシュボード"
              />
            }
          />

          {

            screens.map(
              screen => {

                const [
                  screenId,
                  title,
                  route
                ] = screen;

                if (
                  screenId ===
                  "SCR-025"
                ) {

                  return (
                    <Route
                      key={screenId}
                      path={route}
                      element={
                        <ConverterPage />
                      }
                    />
                  );

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

              }
            )

          }

        </Route>

      </Routes>

    </BrowserRouter>

  );

};
