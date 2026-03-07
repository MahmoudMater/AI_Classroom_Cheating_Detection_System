import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.BACKEND_PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "*"
};
