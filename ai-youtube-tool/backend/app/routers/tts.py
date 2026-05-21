import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.audio_asset import AudioAsset
from app.schemas.audio import TTSGenerateRequest, AudioAssetResponse, AudioAssetList

router = APIRouter(prefix="/tts", tags=["TTS"])


@router.post("/generate", response_model=AudioAssetResponse, status_code=201)
async def generate_tts(body: TTSGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Create a TTS generation task."""
    from app.workers.tts_worker import generate_speech

    audio = AudioAsset(
        text=body.text,
        voice=body.voice,
        model=body.model,
        language_hint=body.language_hint,
        status="pending",
    )
    db.add(audio)
    await db.commit()
    await db.refresh(audio)

    # Dispatch Celery task
    generate_speech.delay(str(audio.id))

    return AudioAssetResponse(
        id=str(audio.id),
        text=audio.text,
        voice=audio.voice,
        model=audio.model,
        language_hint=audio.language_hint,
        status=audio.status,
        local_path=audio.local_path,
        file_size_bytes=audio.file_size_bytes,
        duration_seconds=audio.duration_seconds,
        error_message=audio.error_message,
        created_at=audio.created_at,
    )


@router.get("", response_model=AudioAssetList)
async def list_audio(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all audio assets."""
    total_result = await db.execute(select(func.count()).select_from(AudioAsset))
    total = total_result.scalar() or 0

    result = await db.execute(
        select(AudioAsset).order_by(AudioAsset.created_at.desc()).offset(skip).limit(limit)
    )
    items = result.scalars().all()

    return AudioAssetList(
        items=[AudioAssetResponse(
            id=str(a.id),
            text=a.text,
            voice=a.voice,
            model=a.model,
            language_hint=a.language_hint,
            status=a.status,
            local_path=a.local_path,
            file_size_bytes=a.file_size_bytes,
            duration_seconds=a.duration_seconds,
            error_message=a.error_message,
            created_at=a.created_at,
        ) for a in items],
        total=total,
    )


@router.get("/{audio_id}", response_model=AudioAssetResponse)
async def get_audio(audio_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AudioAsset).where(AudioAsset.id == uuid.UUID(audio_id)))
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")
    return AudioAssetResponse(
        id=str(audio.id), text=audio.text, voice=audio.voice, model=audio.model,
        language_hint=audio.language_hint, status=audio.status, local_path=audio.local_path,
        file_size_bytes=audio.file_size_bytes, duration_seconds=audio.duration_seconds,
        error_message=audio.error_message, created_at=audio.created_at,
    )


@router.delete("/{audio_id}", status_code=204)
async def delete_audio(audio_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AudioAsset).where(AudioAsset.id == uuid.UUID(audio_id)))
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")
    if audio.local_path and Path(audio.local_path).exists():
        Path(audio.local_path).unlink()
    await db.delete(audio)
    await db.commit()


@router.get("/{audio_id}/download")
async def download_audio(audio_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AudioAsset).where(AudioAsset.id == uuid.UUID(audio_id)))
    audio = result.scalar_one_or_none()
    if not audio or not audio.local_path:
        raise HTTPException(status_code=404, detail="Audio file not found")
    path = Path(audio.local_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")
    return FileResponse(
        path=str(path),
        media_type="audio/mpeg",
        filename=f"tts_{audio_id[:8]}.mp3",
    )
