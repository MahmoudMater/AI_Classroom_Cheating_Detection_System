import { Prisma, Severity } from "@prisma/client";
import { prisma } from "../db/prisma";
import { AiAlertRequest } from "../types/dto";
import { AlertRecord, SnapshotRecord } from "../types/models";

function toSeverity(value?: string, confidence?: number): Severity {
  if (value === "low") {
    return Severity.LOW;
  }
  if (value === "high") {
    return Severity.HIGH;
  }
  if (value === "medium") {
    return Severity.MEDIUM;
  }

  if ((confidence ?? 0) >= 0.85) {
    return Severity.HIGH;
  }
  if ((confidence ?? 0) >= 0.65) {
    return Severity.MEDIUM;
  }
  return Severity.LOW;
}

function mapSeverity(value: Severity): "low" | "medium" | "high" {
  if (value === Severity.HIGH) {
    return "high";
  }
  if (value === Severity.LOW) {
    return "low";
  }
  return "medium";
}

function toDate(timestamp?: string): Date {
  const parsed = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

export async function createAlerts(payload: AiAlertRequest): Promise<AlertRecord[]> {
  const createdAt = toDate(payload.timestamp);

  await prisma.detectionLog.create({
    data: {
      sessionId: payload.session_id,
      headDirection: payload.detections?.head_direction,
      phoneDetected: payload.detections?.phone_detected,
      movementLevel: payload.detections?.movement_level,
      rawDetections: (payload.detections as Prisma.InputJsonValue | undefined) ?? undefined,
      timestamp: createdAt
    }
  });

  if (payload.snapshot_url) {
    await prisma.snapshot.create({
      data: {
        sessionId: payload.session_id,
        imagePath: payload.snapshot_url,
        eventType: payload.suspicious_events[0]?.type ?? "unknown",
        timestamp: createdAt
      }
    });
  }

  const records = await prisma.$transaction(
    payload.suspicious_events.map((event) =>
      prisma.alert.create({
        data: {
          sessionId: payload.session_id,
          eventType: event.type,
          confidence: event.confidence,
          severity: toSeverity(event.severity, event.confidence),
          snapshotUrl: payload.snapshot_url,
          metadata: (payload.meta as Prisma.InputJsonValue | undefined) ?? undefined,
          createdAt
        }
      })
    )
  );

  return records.map((record) => ({
    id: record.id,
    sessionId: record.sessionId,
    eventType: record.eventType,
    confidence: record.confidence,
    severity: mapSeverity(record.severity),
    snapshotUrl: record.snapshotUrl ?? undefined,
    timestamp: record.createdAt.toISOString(),
    meta: (record.metadata as Record<string, unknown> | null) ?? undefined
  }));
}

export async function getAlertsForSession(sessionId: string): Promise<AlertRecord[]> {
  const rows = await prisma.alert.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" }
  });

  return rows.map((record) => ({
    id: record.id,
    sessionId: record.sessionId,
    eventType: record.eventType,
    confidence: record.confidence,
    severity: mapSeverity(record.severity),
    snapshotUrl: record.snapshotUrl ?? undefined,
    timestamp: record.createdAt.toISOString(),
    meta: (record.metadata as Record<string, unknown> | null) ?? undefined
  }));
}

export async function getSnapshotsForSession(sessionId: string): Promise<SnapshotRecord[]> {
  const rows = await prisma.snapshot.findMany({
    where: { sessionId },
    orderBy: { timestamp: "desc" }
  });

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    imagePath: row.imagePath,
    eventType: row.eventType,
    timestamp: row.timestamp.toISOString()
  }));
}
