"""
TTS Celery Worker — generates speech from text via OpenAI TTS.
"""
import asyncio
import uuid
import logging
from pathlib import Path

from celery import Task
from celery_app import celery_app
from app.database import AsyncSessionLocal
from app.services.tts_provider import TTSProvider
from app.models.audio_asset import AudioAsset
from app.utils.file_utils import get_file_size
from sqlalchemy import select

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async coroutine from sync Celery context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def get_audio_path(audio_id: uuid.UUID, ext: str = "mp3") -> str:
    from app.config import get_settings
    from pathlib import Path
    base = Path(get_settings().storage_base_path)
    path = base / "audio" / f"{audio_id}.{ext}"
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)


@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=10,
    name="workers.generate_speech",
)
def generate_speech(self: Task, audio_id: str) -> dict:
    logger.info(f"[generate_speech] Starting — audio_id={audio_id}")
    audio_uuid = uuid.UUID(audio_id)

    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(AudioAsset).where(AudioAsset.id == audio_uuid))
            audio = result.scalar_one_or_none()

            if not audio:
                logger.error(f"[generate_speech] AudioAsset not found: {audio_id}")
                return {"status": "failed"}

            provider = TTSProvider(voice=audio.voice)  # routes FPT or OpenAI
            try:
                # Mark processing
                audio.status = "processing"
                await db.commit()

                # Generate speech
                save_path = get_audio_path(audio_uuid)
                await provider.generate_speech(
                    text=audio.text,
                    voice=audio.voice,
                    model=audio.model,
                    save_path=save_path,
                )

                # Update record
                audio.status = "completed"
                audio.local_path = save_path
                audio.file_size_bytes = get_file_size(save_path)
                await db.commit()

                logger.info(f"[generate_speech] Completed — audio_id={audio_id}")
                return {"status": "completed", "audio_id": audio_id, "path": save_path}

            except Exception as e:
                logger.error(f"[generate_speech] Failed — {e}", exc_info=True)
                audio.status = "failed"
                audio.error_message = str(e)
                await db.commit()
                raise

    return run_async(_run())
