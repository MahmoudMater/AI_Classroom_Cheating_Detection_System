import { Router } from "express";
import { healthController } from "../controllers/healthController";
import {
  endSessionController,
  getSessionAlertsController,
  getSessionSnapshotsController,
  startSessionController
} from "../controllers/sessionController";
import { aiAlertController } from "../controllers/aiController";

export const router = Router();

router.get("/health", healthController);
router.post("/sessions/start", startSessionController);
router.post("/sessions/end", endSessionController);
router.get("/sessions/:id/alerts", getSessionAlertsController);
router.get("/sessions/:id/snapshots", getSessionSnapshotsController);
router.post("/ai/alert", aiAlertController);
