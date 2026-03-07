import { Request, Response } from "express";
import { createAlerts } from "../services/alertService";
import { getSession } from "../services/sessionService";
import { AiAlertRequest } from "../types/dto";
import { emitNewAlerts } from "../websocket/socket";

export async function aiAlertController(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as AiAlertRequest;

    if (!body.session_id || !body.timestamp || !Array.isArray(body.suspicious_events)) {
      res.status(400).json({ error: "session_id, timestamp, and suspicious_events are required" });
      return;
    }

    const session = await getSession(body.session_id);
    if (!session) {
      res.status(404).json({ error: "session not found" });
      return;
    }

    const records = await createAlerts(body);
    emitNewAlerts(body.session_id, records);

    res.status(201).json({
      message: "alerts accepted",
      session_id: body.session_id,
      count: records.length,
      alerts: records
    });
  } catch (error) {
    res.status(500).json({ error: "failed to process alert", details: String(error) });
  }
}
