from __future__ import annotations

import logging
import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.proctoring_service import ProctoringService

logger = logging.getLogger(__name__)


class SessionManager:
    def __init__(self) -> None:
        self._active: dict[str, ProctoringService] = {}

    def get(self, session_id: uuid.UUID | str) -> ProctoringService | None:
        return self._active.get(str(session_id))

    def register(self, session_id: uuid.UUID | str, service: ProctoringService) -> None:
        self._active[str(session_id)] = service

    def remove(self, session_id: uuid.UUID | str) -> None:
        self._active.pop(str(session_id), None)

    def stop(self, session_id: uuid.UUID | str) -> None:
        svc = self._active.get(str(session_id))
        if svc is not None:
            svc.stop()

    def list_running(self) -> list[str]:
        return [sid for sid, svc in self._active.items() if svc.is_running]

    async def stop_all(self) -> None:
        for svc in list(self._active.values()):
            try:
                svc.stop()
            except Exception as e:
                logger.warning("stop_all: %s", e)
