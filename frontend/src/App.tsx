import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import {
  AppLayout
} from "./layouts/AppLayout";

import {
  ConverterPage
} from "./pages/ConverterPage";

export default function App() {

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
              <ConverterPage />
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>

  );

}
