"""Sync DB + CSV persistence for proctoring events (called from CV worker thread)."""

from __future__ import annotations

import csv
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import case, create_engine, func, select
from sqlalchemy.orm import sessionmaker

from core.config import Settings
from models.db_models import ExamSession, ProctoringEvent
from models.schemas import (
    ConfidenceBucket,
    DirectionMinuteRow,
    EventResponse,
    EventSummary,
    EventsPage,
    MostSuspiciousPerson,
    ObjectDetectionCount,
    PersonTimelineRow,
    TimelineBucket,
)

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
    from sqlalchemy import literal

    sess_row = await session.get(ExamSession, session_id)
    if sess_row is None:
        raise ValueError("session not found")

    sf = ProctoringEvent.session_id == session_id
    cheat_sum = func.sum(case((ProctoringEvent.verdict == "CHEATING", 1), else_=0))
    ok_sum = func.sum(case((ProctoringEvent.verdict == "OK", 1), else_=0))

    total_events = int((await session.execute(select(func.count()).select_from(ProctoringEvent).where(sf))).scalar_one() or 0)
    cheating_count = int(
        (await session.execute(select(func.count()).select_from(ProctoringEvent).where(sf, ProctoringEvent.verdict == "CHEATING"))).scalar_one()
        or 0
    )
    ok_count = int(
        (await session.execute(select(func.count()).select_from(ProctoringEvent).where(sf, ProctoringEvent.verdict == "OK"))).scalar_one() or 0
    )
    unique_persons = int(
        (await session.execute(select(func.count(func.distinct(ProctoringEvent.person_id))).where(sf))).scalar_one() or 0
    )
    cheating_rate = (cheating_count / total_events) if total_events else 0.0
    risk_score = round(min(100.0, cheating_rate * 100.0), 1) if total_events else 0.0

    dir_stmt = select(ProctoringEvent.direction, func.count()).where(sf).group_by(ProctoringEvent.direction)
    dir_rows = (await session.execute(dir_stmt)).all()
    events_by_direction: dict[str, int] = {}
    for d, c in dir_rows:
        key = d if d is not None else "UNKNOWN"
        events_by_direction[key] = int(c)

    per_stmt = select(ProctoringEvent.person_id, ProctoringEvent.verdict, func.count()).where(sf).group_by(
        ProctoringEvent.person_id, ProctoringEvent.verdict
    )
    per_rows = (await session.execute(per_stmt)).all()
    events_by_person: dict[str, dict[str, int]] = {}
    for pid, verdict, c in per_rows:
        k = str(pid)
        if k not in events_by_person:
            events_by_person[k] = {"cheating": 0, "ok": 0}
        if verdict == "CHEATING":
            events_by_person[k]["cheating"] = int(c)
        elif verdict == "OK":
            events_by_person[k]["ok"] = int(c)

    started_at = sess_row.started_at
    tl_stmt = select(ProctoringEvent.occurred_at, ProctoringEvent.verdict).where(sf)
    tl_rows = (await session.execute(tl_stmt)).all()
    timeline_buckets: dict[int, dict[str, int]] = defaultdict(lambda: {"cheating": 0, "ok": 0})
    for occ, verdict in tl_rows:
        if started_at is not None:
            minute = int((occ - started_at).total_seconds() // 60)
        else:
            minute = 0
        if verdict == "CHEATING":
            timeline_buckets[minute]["cheating"] += 1
        else:
            timeline_buckets[minute]["ok"] += 1
    timeline = [TimelineBucket(minute=m, cheating=b["cheating"], ok=b["ok"]) for m, b in sorted(timeline_buckets.items())]

    minute_trunc = func.date_trunc("minute", ProctoringEvent.occurred_at)

    peak_cheating_minute: str | None = None
    if cheating_count > 0:
        peak_stmt = (
            select(minute_trunc.label("m"), cheat_sum.label("cc"))
            .where(sf)
            .group_by(minute_trunc)
            .having(cheat_sum > 0)
            .order_by(cheat_sum.desc())
            .limit(1)
        )
        prow = (await session.execute(peak_stmt)).first()
        if prow and prow[0] is not None:
            peak_cheating_minute = prow[0].isoformat()

    most_suspicious_person: MostSuspiciousPerson | None = None
    if cheating_count > 0:
        top_stmt = (
            select(ProctoringEvent.person_id, func.count().label("cnt"))
            .where(sf, ProctoringEvent.verdict == "CHEATING")
            .group_by(ProctoringEvent.person_id)
            .order_by(func.count().desc())
            .limit(1)
        )
        top_row = (await session.execute(top_stmt)).first()
        if top_row:
            top_pid = int(top_row[0])
            tot_p = int(
                (
                    await session.execute(
                        select(func.count()).select_from(ProctoringEvent).where(sf, ProctoringEvent.person_id == top_pid)
                    )
                ).scalar_one()
                or 0
            )
            cheat_p = int(top_row[1])
            dom_stmt = (
                select(ProctoringEvent.direction, func.count())
                .where(sf, ProctoringEvent.person_id == top_pid, ProctoringEvent.verdict == "CHEATING", ProctoringEvent.direction.isnot(None))
                .group_by(ProctoringEvent.direction)
                .order_by(func.count().desc())
                .limit(1)
            )
            drow = (await session.execute(dom_stmt)).first()
            dom_dir = str(drow[0]) if drow and drow[0] is not None else "UNKNOWN"
            most_suspicious_person = MostSuspiciousPerson(
                person_id=top_pid,
                cheating_events=cheat_p,
                cheating_rate=round(cheat_p / tot_p, 4) if tot_p else 0.0,
                dominant_direction=dom_dir,
            )

    obj_stmt = (
        select(ProctoringEvent.obj_name, func.count())
        .where(sf, ProctoringEvent.obj_nearby.is_(True), ProctoringEvent.obj_name.isnot(None))
        .group_by(ProctoringEvent.obj_name)
        .order_by(func.count().desc())
    )
    object_detections = [
        ObjectDetectionCount(name=str(name), count=int(cnt)) for name, cnt in (await session.execute(obj_stmt)).all()
    ]

    dir_time_stmt = (
        select(minute_trunc.label("m"), ProctoringEvent.direction, func.count().label("cnt"))
        .where(sf, ProctoringEvent.direction.isnot(None))
        .group_by(minute_trunc, ProctoringEvent.direction)
    )
    dtm_rows = (await session.execute(dir_time_stmt)).all()
    by_min: dict = defaultdict(list)
    for m, direction, cnt in dtm_rows:
        if m is None or direction is None:
            continue
        by_min[m.isoformat()].append((str(direction), int(cnt)))
    direction_over_time: list[DirectionMinuteRow] = []
    for minute_iso, pairs in sorted(by_min.items()):
        best_dir, best_c = max(pairs, key=lambda x: x[1])
        direction_over_time.append(DirectionMinuteRow(minute=minute_iso, direction=best_dir, count=best_c))

    bucket_expr = case(
        (ProctoringEvent.cheat_prob < 0.2, literal("0-20%")),
        (ProctoringEvent.cheat_prob < 0.4, literal("20-40%")),
        (ProctoringEvent.cheat_prob < 0.6, literal("40-60%")),
        (ProctoringEvent.cheat_prob < 0.8, literal("60-80%")),
        else_=literal("80-100%"),
    )
    cd_stmt = select(bucket_expr.label("rng"), func.count()).where(sf).group_by(bucket_expr)
    cd_map = {r: 0 for r in ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"]}
    for rng, cnt in (await session.execute(cd_stmt)).all():
        if rng is not None:
            cd_map[str(rng)] = int(cnt)
    confidence_distribution = [ConfidenceBucket(rng=k, count=v) for k, v in cd_map.items()]

    pt_stmt = (
        select(minute_trunc.label("m"), ProctoringEvent.person_id, cheat_sum.label("ch"), ok_sum.label("ok"))
        .where(sf)
        .group_by(minute_trunc, ProctoringEvent.person_id)
    )
    persons_timeline = [
        PersonTimelineRow(
            person_id=int(pid),
            minute=m.isoformat() if m is not None else "",
            cheating=int(ch or 0),
            ok=int(ok or 0),
        )
        for m, pid, ch, ok in (await session.execute(pt_stmt)).all()
    ]

    return EventSummary(
        session_id=session_id,
        total_events=total_events,
        cheating_count=cheating_count,
        ok_count=ok_count,
        unique_persons=unique_persons,
        cheating_rate=cheating_rate,
        events_by_direction=events_by_direction,
        events_by_person=events_by_person,
        timeline=timeline,
        risk_score=risk_score,
        peak_cheating_minute=peak_cheating_minute,
        most_suspicious_person=most_suspicious_person,
        object_detections=object_detections,
        direction_over_time=direction_over_time,
        confidence_distribution=confidence_distribution,
        persons_timeline=persons_timeline,
    )
