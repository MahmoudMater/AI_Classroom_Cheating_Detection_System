from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Request

from core.config import Settings
from services.frame_broadcaster import FrameBroadcaster
from services.session_manager import SessionManager


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_session_manager(request: Request) -> SessionManager:
    return request.app.state.session_manager


def get_frame_broadcaster(request: Request) -> FrameBroadcaster:
    return request.app.state.frame_broadcaster


SettingsDep = Annotated[Settings, Depends(get_settings)]
SessionManagerDep = Annotated[SessionManager, Depends(get_session_manager)]
FrameBroadcasterDep = Annotated[FrameBroadcaster, Depends(get_frame_broadcaster)]
