import { Request, Response } from "express";
import { prisma } from "../db/prisma";

export async function healthController(_: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      service: "backend",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      status: "error",
      service: "backend",
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
}
