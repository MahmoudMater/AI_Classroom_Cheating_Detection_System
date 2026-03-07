import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env";
import { AlertRecord } from "../types/models";

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.frontendOrigin,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { message: "Connected to alert stream" });
  });

  return io;
}

export function emitNewAlerts(sessionId: string, records: AlertRecord[]): void {
  if (!io || records.length === 0) {
    return;
  }

  records.forEach((record) => {
    io?.emit("new_alert", {
      type: "new_alert",
      session_id: sessionId,
      alert: {
        event_type: record.eventType,
        confidence: record.confidence,
        severity: record.severity,
        snapshot_url: record.snapshotUrl,
        timestamp: record.timestamp
      }
    });
  });
}
