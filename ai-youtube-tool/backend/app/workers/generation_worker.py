"""
Generation Worker — Celery task that drives the full AI generation lifecycle.

Flow:
  1. Receive asset_id + generation_id
  2. Load asset from DB
  3. Submit to AI provider → get provider_request_id
  4. Poll until completed or failed
  5. Download result to local storage
  6. Generate thumbnail
  7. Update Asset + Generation records
"""

import asyncio
import time
import uuid
import logging

from celery import Task

from celery_app import celery_app
from app.database import AsyncSessionLocal
from app.services.ai import get_provider
from app.services.ai.fal_provider import AUDIO_NATIVE_MODELS
from app.services.ai.types import GenerationRequest, GenerationStatus, GenerationType
from app.services import asset_service, generation_service
from app.utils.file_utils import (
    get_asset_path,
    get_thumbnail_path,
    get_extension_from_url,
    generate_thumbnail,
    get_file_size,
)

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 5
MAX_POLL_ATTEMPTS = 120  # 10 minutes max


def run_async(coro):
    """Run async coroutine from sync Celery context."""
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name="workers.generate_asset",
)
def generate_asset(self: Task, asset_id: str, generation_id: str) -> dict:
    """
    Main generation task.
    Args:
        asset_id: UUID of the Asset record to generate
        generation_id: UUID of the Generation record tracking this attempt
    """
    logger.info(f"[generate_asset] Starting — asset_id={asset_id}")
    start_time = time.time()

    asset_uuid = uuid.UUID(asset_id)
    generation_uuid = uuid.UUID(generation_id)
    provider = get_provider()

    async def _run():
        async with AsyncSessionLocal() as db:
            # Load records
            asset = await asset_service.get_asset(db, asset_uuid)
            generation = await generation_service.get_generation(db, generation_uuid)

            if not asset or not generation:
                logger.error(f"[generate_asset] Asset or generation not found: {asset_id}")
                return {"status": "failed", "error": "Record not found"}

            try:
                # 1. Update status → generating
                await asset_service.update_asset_status(db, asset, "generating")
                await generation_service.update_generation(db, generation, "processing")
                await db.commit()

                # 2. Build provider request
                # AI models (Flux, Kling) are most effective with ~300-800 chars.
                # If prompt is longer, truncate intelligently at last sentence boundary.
                AI_PROMPT_LIMIT = 800
                raw_prompt = asset.prompt
                if len(raw_prompt) > AI_PROMPT_LIMIT:
                    truncated = raw_prompt[:AI_PROMPT_LIMIT]
                    # Try to cut at last sentence/clause end for cleaner prompt
                    last_punct = max(
                        truncated.rfind(". "),
                        truncated.rfind(", "),
                        truncated.rfind("\n"),
                    )
                    if last_punct > AI_PROMPT_LIMIT * 0.6:
                        truncated = truncated[:last_punct + 1]
                    effective_prompt = truncated.strip()
                    logger.info(
                        f"[generate_asset] Prompt truncated: {len(raw_prompt)} → {len(effective_prompt)} chars"
                    )
                else:
                    effective_prompt = raw_prompt

                # Model migration: remap deprecated/invalid model IDs stored in DB
                # to their current valid equivalents on fal.ai
                MODEL_MIGRATIONS: dict[str, str] = {
                    # v2.1 never existed → use v2.6 standard
                    "fal-ai/kling-video/v2.1/standard/text-to-video": "fal-ai/kling-video/v2.6/standard/text-to-video",
                    "fal-ai/kling-video/v2.1/pro/text-to-video":      "fal-ai/kling-video/v2.6/pro/text-to-video",
                    "fal-ai/kling-video/v2.1/master/text-to-video":   "fal-ai/kling-video/v2.6/pro/text-to-video",
                    # v3 endpoints → use v2.6 pro
                    "fal-ai/kling-video/v3/standard/text-to-video":   "fal-ai/kling-video/v2.6/standard/text-to-video",
                    "fal-ai/kling-video/v3/pro/text-to-video":        "fal-ai/kling-video/v2.6/pro/text-to-video",
                }
                effective_model = MODEL_MIGRATIONS.get(asset.model, asset.model)
                if effective_model != asset.model:
                    logger.warning(
                        f"[generate_asset] Model migrated: {asset.model} → {effective_model}"
                    )

                gen_request = GenerationRequest(
                    type=GenerationType(asset.type),
                    prompt=effective_prompt,
                    model=effective_model,
                    aspect_ratio=asset.aspect_ratio,
                    duration=asset.duration,
                    resolution=asset.resolution,
                )

                # 3. Submit to AI provider
                if asset.type == "image":
                    result = await provider.generate_image(gen_request)
                else:
                    result = await provider.generate_video(gen_request)

                if result.status == GenerationStatus.FAILED:
                    raise RuntimeError(result.error_message or "Provider submission failed")

                # Save provider_request_id
                await generation_service.update_generation(
                    db, generation, "processing",
                    provider_request_id=result.provider_request_id,
                    request_payload={"model": asset.model, "prompt": asset.prompt},
                )
                await db.commit()

                # 4. If provider returned COMPLETED directly (fal_client.run), skip polling
                if result.status == GenerationStatus.COMPLETED and result.output_url:
                    output_url = result.output_url
                    logger.info(f"[generate_asset] Provider returned result directly — skipping poll")
                else:
                    # Poll for completion (async submit flow)
                    output_url = None
                    for attempt in range(MAX_POLL_ATTEMPTS):
                        await asyncio.sleep(POLL_INTERVAL_SECONDS)
                        status_result = await provider.check_status(result.provider_request_id)

                        if status_result.status == GenerationStatus.COMPLETED:
                            output_url = status_result.output_url
                            break
                        elif status_result.status == GenerationStatus.FAILED:
                            raise RuntimeError(status_result.error_message or "Generation failed at provider")

                        logger.info(f"[generate_asset] Polling attempt {attempt + 1} — still processing")

                    if not output_url:
                        raise RuntimeError("Timed out waiting for generation to complete")


                # 4-b. Videos: add audio via MMAudio v2 (only for silent models like Kling v1)
                if asset.type == "video" and asset.model not in AUDIO_NATIVE_MODELS:
                    meta = asset.metadata_json or {}
                    audio_prompt = (
                        meta.get("audio_prompt")
                        or f"natural ambient sound effects for: {asset.prompt[:200]}"
                    )
                    logger.info(f"[generate_asset] Adding audio via MMAudio v2...")
                    try:
                        if not hasattr(provider, "add_audio_to_video"):
                            raise AttributeError("Provider has no add_audio_to_video (restart worker)")
                        # Timeout 120s — MMAudio can be slow for long videos
                        new_url = await asyncio.wait_for(
                            provider.add_audio_to_video(
                                video_url=output_url,
                                audio_prompt=audio_prompt,
                            ),
                            timeout=120.0,
                        )
                        output_url = new_url
                        logger.info(f"[generate_asset] MMAudio completed — video now has audio")
                    except asyncio.TimeoutError:
                        logger.warning("[generate_asset] MMAudio timed out after 120s — keeping silent video")
                    except Exception as audio_err:
                        logger.warning(f"[generate_asset] MMAudio failed (keeping silent video): {audio_err}")

                # 5. Download result
                extension = get_extension_from_url(output_url, asset.type)
                local_path = get_asset_path(asset.id, asset.type, extension, asset.project_id)
                await provider.download_result(output_url, local_path)

                # 6. Generate thumbnail
                thumbnail_path = get_thumbnail_path(asset.id, asset.project_id)
                generate_thumbnail(local_path, thumbnail_path)

                # 7. Update records
                elapsed_ms = int((time.time() - start_time) * 1000)
                file_size = get_file_size(local_path)

                await asset_service.update_asset_status(
                    db, asset, "completed",
                    local_path=local_path,
                    thumbnail_path=thumbnail_path,
                    file_size_bytes=file_size,
                )
                await generation_service.update_generation(
                    db, generation, "completed",
                    generation_time_ms=elapsed_ms,
                    response_payload={"output_url": output_url},
                )
                await db.commit()

                logger.info(f"[generate_asset] Completed — asset_id={asset_id} in {elapsed_ms}ms")
                return {"status": "completed", "asset_id": asset_id, "local_path": local_path}

            except Exception as e:
                logger.error(f"[generate_asset] Failed — {e}", exc_info=True)
                # Update DB to failed state
                async with AsyncSessionLocal() as err_db:
                    err_asset = await asset_service.get_asset(err_db, asset_uuid)
                    err_gen = await generation_service.get_generation(err_db, generation_uuid)
                    if err_asset:
                        await asset_service.update_asset_status(err_db, err_asset, "failed")
                    if err_gen:
                        await generation_service.update_generation(
                            err_db, err_gen, "failed", error_message=str(e)
                        )
                    await err_db.commit()
                raise

    return run_async(_run())
