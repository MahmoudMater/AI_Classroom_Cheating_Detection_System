from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class FrameBroadcaster:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[WebSocket]] = {}
        self._queue: asyncio.Queue[tuple[str, dict[str, Any]] | None] | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._consumer_task: asyncio.Task[None] | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop
        if self._queue is None:
            self._queue = asyncio.Queue()

    async def start_consumer(self) -> None:
        if self._queue is None:
            self._queue = asyncio.Queue()

        async def _consume() -> None:
            assert self._queue is not None
            while True:
                item = await self._queue.get()
                if item is None:
                    break
                session_id, payload = item
                await self._broadcast_to_subscribers(session_id, payload)

        self._consumer_task = asyncio.create_task(_consume())

    async def stop_consumer(self) -> None:
        if self._queue is not None:
            await self._queue.put(None)
        if self._consumer_task is not None:
            try:
                await self._consumer_task
            except asyncio.CancelledError:
                pass
            self._consumer_task = None

    def broadcast_sync(self, session_id: str, payload: dict[str, Any]) -> None:
        if self._loop is None or self._queue is None:
            return
        try:
            self._loop.call_soon_threadsafe(self._queue.put_nowait, (session_id, payload))
        except Exception as e:
            logger.debug("broadcast_sync drop: %s", e)

    async def subscribe(self, session_id: str, ws: WebSocket) -> None:
        self._subscribers.setdefault(session_id, set()).add(ws)

    async def unsubscribe(self, session_id: str, ws: WebSocket) -> None:
        subs = self._subscribers.get(session_id)
        if not subs:
            return
        subs.discard(ws)
        if not subs:
            self._subscribers.pop(session_id, None)

    async def _broadcast_to_subscribers(self, session_id: str, payload: dict[str, Any]) -> None:
        subs = list(self._subscribers.get(session_id, ()))
        for ws in subs:
            try:
                await ws.send_json(payload)
            except Exception:
                try:
                    await self.unsubscribe(session_id, ws)
                except Exception:
                    pass

    async def broadcast(self, session_id: str, payload: dict[str, Any]) -> None:
        await self._broadcast_to_subscribers(session_id, payload)
