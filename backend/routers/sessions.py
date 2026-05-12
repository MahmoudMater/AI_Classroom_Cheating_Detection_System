from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings
from core.database import get_db
from core.dependencies import get_frame_broadcaster, get_session_manager, get_settings
from models.db_models import ExamSession
from models.enums import SessionStatus
from models.schemas import SessionCreate, SessionResponse
from services.event_store import write_csv_header
from services.frame_broadcaster import FrameBroadcaster
from services.proctoring_service import ProctoringService
from services.session_manager import SessionManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _repo_relative_log_csv(session_id: uuid.UUID) -> str:
    return f"backend/proctoring_runs/{session_id}/events.csv"


def _repo_relative_output_video(session_id: uuid.UUID) -> str:
    return f"backend/proctoring_runs/{session_id}/annotated.avi"


def _resolve_repo_path(settings: Settings, relative: str) -> Path:
    if relative.startswith("backend/"):
        return settings.backend_root.parent / relative
    return Path(relative)


async def _get_session_or_404(db: AsyncSession, session_id: uuid.UUID) -> ExamSession:
    row = await db.get(ExamSession, session_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session not found")
    return row


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    row = ExamSession(
        title=body.title,
        source=body.source,
        status=SessionStatus.IDLE.value,
        extra_metadata=body.metadata or {},
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return SessionResponse.model_validate(row)


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[SessionResponse]:
    stmt = select(ExamSession).order_by(ExamSession.created_at.desc()).limit(limit).offset(offset)
    if status_filter:
        stmt = stmt.where(ExamSession.status == status_filter)
    rows = (await db.execute(stmt)).scalars().all()
    return [SessionResponse.model_validate(r) for r in rows]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> SessionResponse:
    row = await _get_session_or_404(db, session_id)
    return SessionResponse.model_validate(row)


@router.post("/{session_id}/start", response_model=SessionResponse)
async def start_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
    session_manager: SessionManager = Depends(get_session_manager),
    broadcaster: FrameBroadcaster = Depends(get_frame_broadcaster),
) -> SessionResponse:
    row = await _get_session_or_404(db, session_id)
    if row.status == SessionStatus.RUNNING.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="session already running")

    log_rel = _repo_relative_log_csv(session_id)
    vid_rel = _repo_relative_output_video(session_id)
    log_abs = _resolve_repo_path(settings, log_rel)
    vid_abs = _resolve_repo_path(settings, vid_rel)
    log_abs.parent.mkdir(parents=True, exist_ok=True)
    if not log_abs.exists():
        write_csv_header(str(log_abs))

    row.status = SessionStatus.RUNNING.value
    row.started_at = datetime.now(timezone.utc)
    row.log_csv = log_rel
    row.output_video = vid_rel
    await db.flush()
    await db.refresh(row)

    svc = session_manager.get(session_id)
    if svc is None:
        svc = ProctoringService(
            session_id=session_id,
            source=row.source,
            model_dir=settings.MODEL_DIR,
            best_model_file=settings.BEST_MODEL_FILE,
            log_csv_path=str(log_abs),
            output_video_path=str(vid_abs),
            frame_broadcaster=broadcaster,
            jpeg_quality=settings.WS_FRAME_JPEG_QUALITY,
        )
        session_manager.register(session_id, svc)
    svc.start()

    return SessionResponse.model_validate(row)


@router.post("/{session_id}/stop", response_model=SessionResponse)
async def stop_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    session_manager: SessionManager = Depends(get_session_manager),
) -> SessionResponse:
    row = await _get_session_or_404(db, session_id)
    if row.status != SessionStatus.RUNNING.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="session is not running")

    svc = session_manager.get(session_id)
    if svc is not None:
        svc.stop()

    row.status = SessionStatus.STOPPED.value
    row.stopped_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(row)
    return SessionResponse.model_validate(row)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    session_manager: SessionManager = Depends(get_session_manager),
) -> None:
    row = await _get_session_or_404(db, session_id)
    if row.status == SessionStatus.RUNNING.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="cannot delete a running session")

    svc = session_manager.get(session_id)
    if svc is not None:
        session_manager.remove(session_id)

    try:
        await db.execute(delete(ExamSession).where(ExamSession.id == session_id))
        await db.flush()
    except Exception as e:
        logger.exception("delete_session: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e
