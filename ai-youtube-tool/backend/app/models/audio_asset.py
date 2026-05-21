import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class AudioAsset(Base):
    __tablename__ = "audio_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(Text, nullable=False)
    voice = Column(String(50), nullable=False, default="alloy")
    model = Column(String(50), nullable=False, default="tts-1")
    language_hint = Column(String(20), nullable=True)  # e.g. "vi", "en", "ja"
    status = Column(String(20), nullable=False, default="pending")
    local_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
