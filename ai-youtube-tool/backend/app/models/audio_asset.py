import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AudioAsset(Base):
    __tablename__ = "audio_assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    voice: Mapped[str] = mapped_column(String(50), nullable=False, server_default="alloy")
    model: Mapped[str] = mapped_column(String(50), nullable=False, server_default="tts-1")
    language_hint: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g. "vi", "en", "ja"
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    local_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project: Mapped["Project | None"] = relationship("Project")  # noqa: F821
