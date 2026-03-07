import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { router } from "./routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(router);

  return app;
}
