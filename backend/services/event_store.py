"""Sync DB + CSV persistence for proctoring events (called from CV worker thread)."""

from __future__ import annotations

import csv
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from core.config import Settings
from models.db_models import ExamSession, ProctoringEvent
from models.schemas import EventResponse, EventSummary, EventsPage, TimelineBucket

logger = logging.getLogger(__name__)

_settings = Settings()
_sync_engine = create_engine(
    _settings.SYNC_DATABASE_URL,
    pool_size=3,
    max_overflow=2,
    pool_pre_ping=True,
)
SyncSessionLocal = sessionmaker(bind=_sync_engine, expire_on_commit=False, autoflush=False)


def update_exam_session_sync(session_id: uuid.UUID, **fields: Any) -> None:
    """Update exam_sessions row by primary key. Maps ``metadata`` -> ``extra_metadata``."""
    mapped: dict[str, Any] = {}
    for k, v in fields.items():
        if k == "metadata":
            mapped["extra_metadata"] = v
        else:
            mapped[k] = v
    with SyncSessionLocal() as session:
        try:
            row = session.get(ExamSession, session_id)
            if row is None:
                return
            for attr, val in mapped.items():
                setattr(row, attr, val)
            session.commit()
        except Exception:
            session.rollback()
            raise


def save_event_sync(
    session_id: uuid.UUID,
    log_csv_path: str,
    *,
    person_id: int,
    verdict: str,
    cheat_prob: float,
    direction: str | None,
    obj_nearby: bool,
    obj_name: str | None,
    reasons: list[str],
    frame_index: int | None,
) -> None:
    """Insert proctoring_events row and append one line to CSV (mandatory)."""
    occurred_at = datetime.now(timezone.utc)
    event_id = uuid.uuid4()
    reasons_list = list(reasons) if reasons else []

    with SyncSessionLocal() as session:
        try:
            ev = ProctoringEvent(
                id=event_id,
                session_id=session_id,
                person_id=person_id,
                verdict=verdict,
                cheat_prob=cheat_prob,
                direction=direction,
                obj_nearby=obj_nearby,
                obj_name=obj_name or None,
                reasons=reasons_list,
                frame_index=frame_index,
                occurred_at=occurred_at,
            )
            session.add(ev)
            session.commit()
        except Exception:
            session.rollback()
            raise

    ts = occurred_at.strftime("%Y-%m-%d %H:%M:%S")
    path = Path(log_csv_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                ts,
                person_id,
                verdict,
                f"{cheat_prob:.4f}",
                direction or "",
                obj_nearby,
                obj_name or "",
                " | ".join(reasons_list),
            ]
        )


def write_csv_header(log_csv_path: str) -> None:
    path = Path(log_csv_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            ["timestamp", "person_id", "verdict", "cheat_prob", "direction", "obj_nearby", "obj_name", "reasons"]
        )


async def get_events(
    session,
    session_id: uuid.UUID,
    *,
    verdict: str | None,
    person_id: int | None,
    from_ts: datetime | None,
    to_ts: datetime | None,
    limit: int,
    offset: int,
) -> EventsPage:
    stmt = select(ProctoringEvent).where(ProctoringEvent.session_id == session_id)
    count_stmt = select(func.count()).select_from(ProctoringEvent).where(ProctoringEvent.session_id == session_id)
    if verdict:
        stmt = stmt.where(ProctoringEvent.verdict == verdict)
        count_stmt = count_stmt.where(ProctoringEvent.verdict == verdict)
    if person_id is not None:
        stmt = stmt.where(ProctoringEvent.person_id == person_id)
        count_stmt = count_stmt.where(ProctoringEvent.person_id == person_id)
    if from_ts is not None:
        stmt = stmt.where(ProctoringEvent.occurred_at >= from_ts)
        count_stmt = count_stmt.where(ProctoringEvent.occurred_at >= from_ts)
    if to_ts is not None:
        stmt = stmt.where(ProctoringEvent.occurred_at <= to_ts)
        count_stmt = count_stmt.where(ProctoringEvent.occurred_at <= to_ts)

    total = int((await session.execute(count_stmt)).scalar_one())
    stmt = stmt.order_by(ProctoringEvent.occurred_at.desc()).limit(limit).offset(offset)
    rows = (await session.execute(stmt)).scalars().all()
    items = [EventResponse.model_validate(r) for r in rows]
    return EventsPage(total=total, items=items)


async def get_summary(session, session_id: uuid.UUID) -> EventSummary:
    sess_row = await session.get(ExamSession, session_id)
    if sess_row is None:
        raise ValueError("session not found")

    stmt = select(ProctoringEvent).where(ProctoringEvent.session_id == session_id)
    rows = (await session.execute(stmt)).scalars().all()

    total_events = len(rows)
    cheating_count = sum(1 for r in rows if r.verdict == "CHEATING")
    ok_count = sum(1 for r in rows if r.verdict == "OK")
    persons = {r.person_id for r in rows}
    unique_persons = len(persons)
    cheating_rate = (cheating_count / total_events) if total_events else 0.0

    events_by_direction: dict[str, int] = defaultdict(int)
    for r in rows:
        d = r.direction or "UNKNOWN"
        events_by_direction[d] += 1

    events_by_person: dict[str, dict[str, int]] = defaultdict(lambda: {"cheating": 0, "ok": 0})
    for r in rows:
        key = str(r.person_id)
        if r.verdict == "CHEATING":
            events_by_person[key]["cheating"] += 1
        else:
            events_by_person[key]["ok"] += 1

    started_at = sess_row.started_at
    timeline_buckets: dict[int, dict[str, int]] = defaultdict(lambda: {"cheating": 0, "ok": 0})
    for r in rows:
        if started_at is not None:
            minute = int((r.occurred_at - started_at).total_seconds() // 60)
        else:
            minute = 0
        if r.verdict == "CHEATING":
            timeline_buckets[minute]["cheating"] += 1
        else:
            timeline_buckets[minute]["ok"] += 1

    timeline = [
        TimelineBucket(minute=m, cheating=b["cheating"], ok=b["ok"]) for m, b in sorted(timeline_buckets.items())
    ]

    return EventSummary(
        session_id=session_id,
        total_events=total_events,
        cheating_count=cheating_count,
        ok_count=ok_count,
        unique_persons=unique_persons,
        cheating_rate=cheating_rate,
        events_by_direction=dict(events_by_direction),
        events_by_person={k: dict(v) for k, v in events_by_person.items()},
        timeline=timeline,
    )
