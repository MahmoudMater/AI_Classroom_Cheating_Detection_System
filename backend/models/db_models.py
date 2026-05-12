import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, Uuid, func, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(512), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="idle")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stopped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    output_video: Mapped[str | None] = mapped_column(String(512), nullable=True)
    log_csv: Mapped[str | None] = mapped_column(String(512), nullable=True)
    model_file: Mapped[str] = mapped_column(
        String(255), nullable=False, server_default="cnn_cheating_model.pth"
    )
    extra_metadata: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB, nullable=True)

    events: Mapped[list["ProctoringEvent"]] = relationship(
        "ProctoringEvent", back_populates="session", passive_deletes=True
    )


class ProctoringEvent(Base):
    __tablename__ = "proctoring_events"
    __table_args__ = (
        Index("ix_proctoring_events_session_occurred", "session_id", "occurred_at"),
        Index(
            "ix_proctoring_events_session_verdict_cheating",
            "session_id",
            "verdict",
            postgresql_where=text("verdict = 'CHEATING'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("exam_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    person_id: Mapped[int] = mapped_column(Integer, nullable=False)
    verdict: Mapped[str] = mapped_column(String(16), nullable=False)
    cheat_prob: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[str | None] = mapped_column(String(32), nullable=True)
    obj_nearby: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    obj_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reasons: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    frame_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    session: Mapped["ExamSession"] = relationship("ExamSession", back_populates="events")

