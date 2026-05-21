import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class GenerateRequest(BaseModel):
    """Request to trigger a new AI generation."""
    project_id: uuid.UUID | None = None
    type: Literal["image", "video"]
    prompt: str = Field(..., min_length=3, max_length=10000)
    model: str = Field(default="fal-ai/flux/schnell")
    aspect_ratio: str = Field(default="16:9")
    duration: int | None = Field(default=None, ge=1, le=60)  # video only, seconds
    resolution: str | None = None
    # Video audio options (video only — ignored for images)
    add_audio: bool = Field(default=False, description="Add AI-generated audio via MMAudio v2")
    audio_prompt: str | None = Field(default=None, max_length=500, description="Describe desired audio")


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID | None
    type: str
    prompt: str
    enhanced_prompt: str | None
    model: str
    provider: str
    aspect_ratio: str
    duration: int | None
    resolution: str | None
    local_path: str | None
    thumbnail_path: str | None
    file_size_bytes: int | None
    status: str
    metadata_json: dict
    created_at: datetime
    updated_at: datetime


class AssetListResponse(BaseModel):
    items: list[AssetResponse]
    total: int
    page: int
    page_size: int
