export type SessionStatus = "active" | "ended";

export interface ExamSession {
  sessionId: string;
  examId?: string;
  studentId?: string;
  videoSource?: string;
  startedAt: string;
  endedAt?: string;
  status: SessionStatus;
}

export interface AlertRecord {
  id: string;
  sessionId: string;
  eventType: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  snapshotUrl?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface SnapshotRecord {
  id: string;
  sessionId: string;
  imagePath: string;
  eventType: string;
  timestamp: string;
}
