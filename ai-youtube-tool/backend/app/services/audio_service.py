import uuid
from pathlib import Path

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audio_asset import AudioAsset
from app.schemas.audio import TTSGenerateRequest


async def list_audio_assets(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[AudioAsset], int]:
    """Return paginated audio assets (newest first) and total count."""
    total_result = await db.execute(select(func.count()).select_from(AudioAsset))
    total = total_result.scalar() or 0

    result = await db.execute(
        select(AudioAsset)
        .order_by(AudioAsset.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all(), total


async def get_audio_asset(db: AsyncSession, audio_id: uuid.UUID) -> AudioAsset | None:
    """Fetch a single audio asset by ID."""
    result = await db.execute(select(AudioAsset).where(AudioAsset.id == audio_id))
    return result.scalar_one_or_none()


async def create_audio_asset(db: AsyncSession, data: TTSGenerateRequest) -> AudioAsset:
    """Create a new AudioAsset record in pending state."""
    audio = AudioAsset(
        text=data.text,
        voice=data.voice,
        model=data.model,
        language_hint=data.language_hint,
        status="pending",
    )
    db.add(audio)
    await db.flush()
    await db.refresh(audio)
    return audio


async def delete_audio_asset(db: AsyncSession, audio: AudioAsset) -> None:
    """Delete the audio asset record and its file from disk."""
    if audio.local_path and Path(audio.local_path).exists():
        Path(audio.local_path).unlink(missing_ok=True)
    await db.delete(audio)
