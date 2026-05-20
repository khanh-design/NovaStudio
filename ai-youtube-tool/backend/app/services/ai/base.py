from abc import ABC, abstractmethod

from app.services.ai.types import GenerationRequest, GenerationResult


class AIProvider(ABC):
    """
    Abstract base class for all AI generation providers.

    Implement this interface to add a new provider (Replicate, RunwayML, etc.)
    without changing any application logic.
    """

    @abstractmethod
    async def generate_image(self, request: GenerationRequest) -> GenerationResult:
        """Submit an image generation request. Returns immediately with a request ID."""
        ...

    @abstractmethod
    async def generate_video(self, request: GenerationRequest) -> GenerationResult:
        """Submit a video generation request. Returns immediately with a request ID."""
        ...

    @abstractmethod
    async def check_status(self, provider_request_id: str) -> GenerationResult:
        """Poll the provider for the current status of a generation job."""
        ...

    @abstractmethod
    async def download_result(self, output_url: str, save_path: str) -> str:
        """Download the generated file from provider URL to local disk. Returns local_path."""
        ...
