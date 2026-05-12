from __future__ import annotations

import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings
from core.database import get_db
from core.dependencies import get_settings
from models.schemas import EventSummary, EventsPage
from services import event_store

logger = logging.getLogger(__name__)

router = APIRouter(tags=["events"])


def _resolve_repo_path(settings: Settings, relative: str) -> Path:
    if relative.startswith("backend/"):
        return settings.backend_root.parent / relative
    return Path(relative)


async def _ensure_session(db: AsyncSession, session_id: uuid.UUID):
    from models.db_models import ExamSession

    row = await db.get(ExamSession, session_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session not found")
    return row


@router.get("/sessions/{session_id}/events", response_model=EventsPage)
async def list_events(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    verdict: str | None = None,
    person_id: int | None = None,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> EventsPage:
    await _ensure_session(db, session_id)
    limit = min(max(limit, 1), 500)
    offset = max(offset, 0)
    try:
        return await event_store.get_events(
            db,
            session_id,
            verdict=verdict,
            person_id=person_id,
            from_ts=from_ts,
            to_ts=to_ts,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        logger.exception("list_events: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e


@router.get("/sessions/{session_id}/events/summary", response_model=EventSummary)
async def events_summary(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> EventSummary:
    await _ensure_session(db, session_id)
    try:
        return await event_store.get_summary(db, session_id)
    except Exception as e:
        logger.exception("events_summary: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e


@router.get("/sessions/{session_id}/events/export")
async def export_events(
    session_id: uuid.UUID,
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    row = await _ensure_session(db, session_id)
    if not row.log_csv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="log_csv not set for session")
    path = _resolve_repo_path(settings, row.log_csv)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="csv file not found")
    return FileResponse(
        path,
        media_type="text/csv",
        filename=f"session_{session_id}_events.csv",
    )
