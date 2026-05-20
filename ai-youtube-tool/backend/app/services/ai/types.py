from enum import Enum
from dataclasses import dataclass, field


class GenerationType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class GenerationStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class GenerationRequest:
    """Unified request sent to any AI provider."""
    type: GenerationType
    prompt: str
    model: str
    aspect_ratio: str = "16:9"
    duration: int | None = None          # seconds, video only
    resolution: str | None = None
    seed: int | None = None
    reference_image_url: str | None = None
    extra_params: dict = field(default_factory=dict)


@dataclass
class GenerationResult:
    """Unified result from any AI provider."""
    status: GenerationStatus
    provider_request_id: str | None = None
    output_url: str | None = None        # URL to download from provider
    local_path: str | None = None        # Path after downloaded to disk
    thumbnail_path: str | None = None
    generation_time_ms: int | None = None
    cost_usd: float | None = None
    error_message: str | None = None
    raw_response: dict | None = None     # Full provider response for debugging
