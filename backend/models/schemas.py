from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SessionCreate(BaseModel):
    title: str
    source: str = "0"
    metadata: dict[str, Any] = Field(default_factory=dict)


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    title: str
    source: str
    status: str
    started_at: datetime | None
    stopped_at: datetime | None
    created_at: datetime
    output_video: str | None
    log_csv: str | None
    metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias="extra_metadata",
        serialization_alias="metadata",
    )


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: uuid.UUID
    person_id: int
    verdict: str
    cheat_prob: float
    direction: str | None
    obj_nearby: bool
    obj_name: str | None
    reasons: list[str] | None
    frame_index: int | None
    occurred_at: datetime


class EventsPage(BaseModel):
    total: int
    items: list[EventResponse]


class TimelineBucket(BaseModel):
    minute: int
    cheating: int
    ok: int


class EventSummary(BaseModel):
    session_id: uuid.UUID
    total_events: int
    cheating_count: int
    ok_count: int
    unique_persons: int
    cheating_rate: float
    events_by_direction: dict[str, int]
    events_by_person: dict[str, dict[str, int]]
    timeline: list[TimelineBucket]


class PersonFrame(BaseModel):
    id: int
    verdict: str
    cheat_prob: float
    direction: str
    obj_nearby: bool
    obj_name: str
    reasons: list[str]
    bbox: list[int]


class FrameSummary(BaseModel):
    person_count: int
    cheating_count: int


class FramePayload(BaseModel):
    type: str
    session_id: str
    frame_index: int
    fps: float
    timestamp: str
    frame_b64: str
    persons: list[PersonFrame]
    summary: FrameSummary
