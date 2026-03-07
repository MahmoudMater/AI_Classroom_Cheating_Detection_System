import { Request, Response } from "express";
import { EndSessionRequest, StartSessionRequest } from "../types/dto";
import { endSession, getSession, startSession } from "../services/sessionService";
import { getAlertsForSession, getSnapshotsForSession } from "../services/alertService";

export async function startSessionController(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as StartSessionRequest;
    if (!body.session_id) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    const session = await startSession(body);
    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ error: "failed to start session", details: String(error) });
  }
}

export async function endSessionController(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as EndSessionRequest;
    if (!body.session_id) {
      res.status(400).json({ error: "session_id is required" });
      return;
    }

    const session = await endSession(body.session_id);
    if (!session) {
      res.status(404).json({ error: "session not found" });
      return;
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: "failed to end session", details: String(error) });
  }
}

export async function getSessionAlertsController(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.id;
    if (!(await getSession(sessionId))) {
      res.status(404).json({ error: "session not found" });
      return;
    }

    res.json({ session_id: sessionId, alerts: await getAlertsForSession(sessionId) });
  } catch (error) {
    res.status(500).json({ error: "failed to get alerts", details: String(error) });
  }
}

export async function getSessionSnapshotsController(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.id;
    if (!(await getSession(sessionId))) {
      res.status(404).json({ error: "session not found" });
      return;
    }

    res.json({ session_id: sessionId, snapshots: await getSnapshotsForSession(sessionId) });
  } catch (error) {
    res.status(500).json({ error: "failed to get snapshots", details: String(error) });
  }
}
