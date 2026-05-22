import os
import asyncio
from pathlib import Path

import httpx
import fal_client

from app.config import get_settings
from app.services.ai.base import AIProvider
from app.services.ai.types import (
    GenerationRequest,
    GenerationResult,
    GenerationStatus,
    GenerationType,
)

settings = get_settings()

# fal.ai model mappings
IMAGE_MODELS = {
    "fal-ai/flux/schnell": "fal-ai/flux/schnell",
    "fal-ai/flux/dev": "fal-ai/flux/dev",
    "fal-ai/flux-pro": "fal-ai/flux-pro",
    "fal-ai/stable-diffusion-xl": "fal-ai/stable-diffusion-xl",
}

VIDEO_MODELS = {
    # Kling v1 — silent (MMAudio post-processing)
    "fal-ai/kling-video/v1/standard/text-to-video":   "fal-ai/kling-video/v1/standard/text-to-video",
    "fal-ai/kling-video/v1/pro/text-to-video":         "fal-ai/kling-video/v1/pro/text-to-video",
    # Kling v1.6 — silent (MMAudio post-processing)
    "fal-ai/kling-video/v1.6/standard/text-to-video": "fal-ai/kling-video/v1.6/standard/text-to-video",
    "fal-ai/kling-video/v1.6/pro/text-to-video":      "fal-ai/kling-video/v1.6/pro/text-to-video",
    # Kling v2.6 — native audio ✅ (confirmed on fal.ai)
    "fal-ai/kling-video/v2.6/standard/text-to-video": "fal-ai/kling-video/v2.6/standard/text-to-video",
    "fal-ai/kling-video/v2.6/pro/text-to-video":      "fal-ai/kling-video/v2.6/pro/text-to-video",
    # Minimax Video — native audio ✅
    "fal-ai/minimax/video-01":      "fal-ai/minimax/video-01",
    "fal-ai/minimax/video-01-live": "fal-ai/minimax/video-01-live",
}

# Models that generate audio natively — MMAudio post-processing is skipped for these
AUDIO_NATIVE_MODELS: set[str] = {
    "fal-ai/kling-video/v2.6/standard/text-to-video",
    "fal-ai/kling-video/v2.6/pro/text-to-video",
    "fal-ai/minimax/video-01",
    "fal-ai/minimax/video-01-live",
}


class FalProvider(AIProvider):
    """
    fal.ai implementation using fal_client.run() for simplicity.
    run() is blocking but we wrap it in asyncio.to_thread().
    Returns COMPLETED directly — no polling needed.
    """

    def __init__(self):
        if not settings.fal_key:
            raise ValueError("FAL_KEY is not configured. Set it in .env file.")
        os.environ["FAL_KEY"] = settings.fal_key

    # ------------------------------------------------------------------
    # Image generation
    # ------------------------------------------------------------------

    async def generate_image(self, request: GenerationRequest) -> GenerationResult:
        model_id = IMAGE_MODELS.get(request.model, request.model)
        payload = {
            "prompt": request.prompt,
            "image_size": self._map_aspect_ratio(request.aspect_ratio),
            **request.extra_params,
        }
        if request.seed is not None:
            payload["seed"] = request.seed

        try:
            result = await asyncio.to_thread(
                fal_client.run, model_id, arguments=payload
            )
            output_url = self._extract_output_url(result)
            if not output_url:
                return GenerationResult(
                    status=GenerationStatus.FAILED,
                    error_message=f"No output URL in response: {result}",
                )
            return GenerationResult(
                status=GenerationStatus.COMPLETED,
                provider_request_id=f"{model_id}|direct",
                output_url=output_url,
                raw_response=result,
            )
        except Exception as e:
            return GenerationResult(
                status=GenerationStatus.FAILED,
                error_message=str(e),
            )

    # ------------------------------------------------------------------
    # Video generation
    # ------------------------------------------------------------------

    async def generate_video(self, request: GenerationRequest) -> GenerationResult:
        import logging
        logger = logging.getLogger(__name__)

        model_id = VIDEO_MODELS.get(request.model, request.model)

        # Kling Video only accepts duration '5' or '10' (as string)
        raw_duration = request.duration or 5
        kling_duration = "10" if raw_duration > 7 else "5"

        payload = {
            "prompt": request.prompt,
            "aspect_ratio": request.aspect_ratio,
            "duration": kling_duration,
            **request.extra_params,
        }

        # Enable native audio for v2.6+ and Minimax models
        if model_id in AUDIO_NATIVE_MODELS:
            payload["generate_audio"] = True

        logger.info(f"[FalProvider] Video request — model={model_id}, payload={payload}")

        try:
            # Use subscribe() instead of run() for video generation.
            # subscribe() is queue-backed with automatic polling — it waits
            # for the FULL pipeline (video + audio) to complete.
            # run() can timeout or return before audio processing finishes.
            result = await asyncio.to_thread(
                fal_client.subscribe, model_id, arguments=payload
            )
            logger.info(f"[FalProvider] Video result keys: {list(result.keys()) if isinstance(result, dict) else type(result)}")

            output_url = self._extract_output_url(result)
            if not output_url:
                return GenerationResult(
                    status=GenerationStatus.FAILED,
                    error_message=f"No output URL in response: {result}",
                )
            return GenerationResult(
                status=GenerationStatus.COMPLETED,
                provider_request_id=f"{model_id}|subscribe",
                output_url=output_url,
                raw_response=result,
            )
        except Exception as e:
            logger.error(f"[FalProvider] Video generation failed: {e}")
            return GenerationResult(
                status=GenerationStatus.FAILED,
                error_message=str(e),
            )

    # ------------------------------------------------------------------
    # MMAudio v2 — add synchronized audio to a silent video
    # Docs: https://fal.ai/models/fal-ai/mmaudio-v2
    # ------------------------------------------------------------------

    async def add_audio_to_video(
        self,
        video_url: str,
        audio_prompt: str = "",
        negative_prompt: str = "music",
        duration: float | None = None,
    ) -> str:
        """
        Call fal-ai/mmaudio-v2 to add AI-generated synchronized audio to a video.
        Returns the URL of the new video (with audio embedded).
        """
        payload: dict = {
            "video_url": video_url,
            "prompt": audio_prompt or "natural ambient sound effects synchronized with video",
            "negative_prompt": negative_prompt,
            "num_steps": 25,
        }
        if duration is not None:
            payload["duration"] = duration

        try:
            result = await asyncio.to_thread(
                fal_client.subscribe, "fal-ai/mmaudio-v2", arguments=payload
            )
            # MMAudio returns {"video": {"url": "..."}, "audio": {"url": "..."}}
            if isinstance(result, dict):
                video = result.get("video") or {}
                url = video.get("url") if isinstance(video, dict) else None
                if url:
                    return url
            raise RuntimeError(f"MMAudio returned unexpected format: {result}")
        except Exception as e:
            raise RuntimeError(f"MMAudio v2 failed: {e}") from e


    # ------------------------------------------------------------------
    # check_status — not used with run() but kept for interface compat
    # ------------------------------------------------------------------

    async def check_status(self, provider_request_id: str) -> GenerationResult:
        # With fal_client.run(), generation completes synchronously.
        # This method should never be called in normal flow.
        return GenerationResult(
            status=GenerationStatus.COMPLETED,
            provider_request_id=provider_request_id,
        )

    # ------------------------------------------------------------------
    # Download
    # ------------------------------------------------------------------

    async def download_result(self, output_url: str, save_path: str) -> str:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        async with httpx.AsyncClient(timeout=300) as client:
            async with client.stream("GET", output_url) as response:
                response.raise_for_status()
                with open(save_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        f.write(chunk)
        return save_path

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _map_aspect_ratio(self, aspect_ratio: str) -> str:
        mapping = {
            "16:9": "landscape_16_9",
            "9:16": "portrait_16_9",
            "1:1": "square",
            "4:3": "landscape_4_3",
            "3:4": "portrait_4_3",
        }
        return mapping.get(aspect_ratio, "landscape_16_9")

    def _extract_output_url(self, result: dict) -> str | None:
        if isinstance(result, dict):
            # Image: {"images": [{"url": "..."}]}
            if "images" in result and result["images"]:
                return result["images"][0].get("url")
            # Video: {"video": {"url": "..."}}
            if "video" in result and isinstance(result["video"], dict):
                return result["video"].get("url")
            # Fallback: {"url": "..."}
            if "url" in result:
                return result["url"]
        return None
