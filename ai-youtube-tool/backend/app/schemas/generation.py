import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class GenerationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    provider: str
    provider_request_id: str | None
    model: str
    generation_time_ms: int | None
    cost_usd: Decimal | None
    status: str
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None


class GenerationStatusResponse(BaseModel):
    """Lightweight status check response."""
    generation_id: uuid.UUID
    asset_id: uuid.UUID
    status: str
    asset_status: str
    error_message: str | None = None
    local_path: str | None = None
    thumbnail_path: str | None = None
