from __future__ import annotations

import logging
import uuid
from typing import TYPE_CHECKING

from services.frame_broadcaster import FrameBroadcaster

if TYPE_CHECKING:
    from services.proctoring_service import ProctoringService

logger = logging.getLogger(__name__)


class SessionManager:
    def __init__(self) -> None:
        self._active: dict[str, "ProctoringService"] = {}

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

    def start(
        self,
        session_id: uuid.UUID,
        *,
        source: str,
        model_dir: str,
        model_file: str,
        log_csv_path: str,
        output_video_path: str,
        frame_broadcaster: FrameBroadcaster,
        jpeg_quality: int,
    ) -> "ProctoringService":
        """Create or reuse ``ProctoringService``, then ``start()`` the worker thread."""
        from services.proctoring_service import ProctoringService

        existing = self.get(session_id)
        if existing is not None and getattr(existing, "_model_file", "") == model_file:
            existing.set_source(source)
            svc = existing
        else:
            if existing is not None:
                existing.stop()
                self.remove(session_id)
            svc = ProctoringService(
                session_id=session_id,
                source=source,
                model_dir=model_dir,
                model_file=model_file,
                log_csv_path=log_csv_path,
                output_video_path=output_video_path,
                frame_broadcaster=frame_broadcaster,
                jpeg_quality=jpeg_quality,
            )
            self.register(session_id, svc)
        svc.start()
        return svc

    def list_running(self) -> list[str]:
        return [sid for sid, svc in self._active.items() if svc.is_running]

    async def stop_all(self) -> None:
        for svc in list(self._active.values()):
            try:
                svc.stop()
            except Exception as e:
                logger.warning("stop_all: %s", e)
