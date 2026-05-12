from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings
from core.database import get_db
from core.dependencies import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
) -> dict:
    db_status = "error"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass
    return {"status": "ok", "db": db_status, "version": settings.API_VERSION}
