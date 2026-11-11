import { env } from "@/config/env";
import "dotenv/config";
import { createApp } from "./app";

const app = createApp();

app.listen(
  env.port,
  () => {
    console.log(`[${env.appName}] started`);
    console.log(`http://localhost:${env.port}`);
  }
);
