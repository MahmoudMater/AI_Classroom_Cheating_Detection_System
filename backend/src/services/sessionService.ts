import { SessionStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { StartSessionRequest } from "../types/dto";
import { ExamSession } from "../types/models";

function mapSession(record: {
  sessionId: string;
  examId: string | null;
  studentId: string | null;
  videoSource: string | null;
  startedAt: Date;
  endedAt: Date | null;
  status: SessionStatus;
}): ExamSession {
  return {
    sessionId: record.sessionId,
    examId: record.examId ?? undefined,
    studentId: record.studentId ?? undefined,
    videoSource: record.videoSource ?? undefined,
    startedAt: record.startedAt.toISOString(),
    endedAt: record.endedAt?.toISOString(),
    status: record.status === "ACTIVE" ? "active" : "ended"
  };
}

export async function startSession(payload: StartSessionRequest): Promise<ExamSession> {
  const existing = await prisma.examSession.findUnique({
    where: { sessionId: payload.session_id }
  });

  if (!existing) {
    const created = await prisma.examSession.create({
      data: {
        sessionId: payload.session_id,
        examId: payload.exam_id,
        studentId: payload.student_id,
        videoSource: payload.video_source,
        status: SessionStatus.ACTIVE,
        startedAt: new Date(),
        endedAt: null
      }
    });

    return mapSession(created);
  }

  if (existing.status === SessionStatus.ACTIVE) {
    return mapSession(existing);
  }

  const restarted = await prisma.examSession.update({
    where: { sessionId: payload.session_id },
    data: {
      examId: payload.exam_id ?? existing.examId,
      studentId: payload.student_id ?? existing.studentId,
      videoSource: payload.video_source ?? existing.videoSource,
      status: SessionStatus.ACTIVE,
      startedAt: new Date(),
      endedAt: null
    }
  });

  return mapSession(restarted);
}

export async function endSession(sessionId: string): Promise<ExamSession | null> {
  const session = await prisma.examSession.findUnique({
    where: { sessionId }
  });

  if (!session) {
    return null;
  }

  const updated = await prisma.examSession.update({
    where: { sessionId },
    data: {
      status: SessionStatus.ENDED,
      endedAt: new Date()
    }
  });

  return mapSession(updated);
}

export async function getSession(sessionId: string): Promise<ExamSession | null> {
  const session = await prisma.examSession.findUnique({
    where: { sessionId }
  });

  if (!session) {
    return null;
  }

  return mapSession(session);
}
