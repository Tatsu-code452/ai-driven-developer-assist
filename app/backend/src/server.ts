import express from "express";
import cors from "cors";

import projectRoutes
  from "./routes/projectRoutes.js";

import {
  currentProjectMiddleware
} from "./middleware/currentProject.js";

import {
  errorHandler
} from "./middleware/errorHandler.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(
  currentProjectMiddleware
);

app.get(
  "/health",
  (_req, res) =>
    res.json({
      success: true
    })
);

app.use(
  "/api",
  projectRoutes
);

app.use(
  errorHandler
);

const port =
  process.env.PORT || 3000;

app.listen(
  port,
  () =>
    console.log(
      `server start ${port}`
    )
);
