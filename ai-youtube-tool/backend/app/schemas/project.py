import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    description: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    thumbnail_path: str | None = None
    created_at: datetime
    updated_at: datetime


class ProjectWithStats(ProjectResponse):
    asset_count: int = 0
    completed_count: int = 0
