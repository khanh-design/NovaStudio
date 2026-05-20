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
    "fal-ai/kling-video/v1/standard/text-to-video": "fal-ai/kling-video/v1/standard/text-to-video",
    "fal-ai/kling-video/v1/pro/text-to-video": "fal-ai/kling-video/v1/pro/text-to-video",
    "fal-ai/minimax-video/image-to-video": "fal-ai/minimax-video/image-to-video",
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
        model_id = VIDEO_MODELS.get(request.model, request.model)
        payload = {
            "prompt": request.prompt,
            "aspect_ratio": request.aspect_ratio,
            **request.extra_params,
        }
        if request.duration:
            payload["duration"] = str(request.duration)

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
