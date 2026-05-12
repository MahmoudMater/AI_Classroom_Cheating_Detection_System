from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.database import AsyncSessionLocal
from models.db_models import ExamSession
from models.enums import SessionStatus
from services.frame_broadcaster import FrameBroadcaster

logger = logging.getLogger(__name__)

router = APIRouter(tags=["stream"])


@router.websocket("/ws/{session_id}")
async def websocket_frames(
    websocket: WebSocket,
    session_id: uuid.UUID,
) -> None:
    broadcaster: FrameBroadcaster = websocket.app.state.frame_broadcaster

    await websocket.accept()

    row: ExamSession | None = None
    try:
        async with AsyncSessionLocal() as session:
            row = await session.get(ExamSession, session_id)
    except Exception as e:
        logger.exception("ws db: %s", e)
        await websocket.close(code=1011)
        return

    if row is None:
        await websocket.close(code=1008)
        return

    if row.status in (
        SessionStatus.IDLE.value,
        SessionStatus.STOPPED.value,
        SessionStatus.ERROR.value,
    ):
        try:
            await websocket.send_json(
                {"type": "status", "status": row.status, "message": f"session is {row.status}"}
            )
        except Exception:
            pass
        await websocket.close(code=1000)
        return

    if row.status != SessionStatus.RUNNING.value:
        try:
            await websocket.send_json({"type": "status", "status": row.status, "message": "unexpected status"})
        except Exception:
            pass
        await websocket.close(code=1000)
        return

    sid = str(session_id)
    await broadcaster.subscribe(sid, websocket)
    try:
        while True:
            raw = await websocket.receive_json()
            if isinstance(raw, dict) and raw.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.debug("websocket receive: %s", e)
    finally:
        try:
            await broadcaster.unsubscribe(sid, websocket)
        except Exception:
            pass
