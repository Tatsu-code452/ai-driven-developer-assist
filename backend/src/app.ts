import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";

export const createApp = () => {

  const app = express();

  app.use(cors());

  app.use(
    express.json({
      limit: "10mb"
    })
  );

  app.use(
    express.urlencoded({
      extended: true
    })
  );

  app.get(
    "/",
    (_req, res) => {
      res.json({
        application: "AI Driven Dev Support",
        version: "0.1.0"
      });
    }
  );

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};
