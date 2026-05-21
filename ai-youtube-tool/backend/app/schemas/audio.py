from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


VOICES = [
    # OpenAI voices
    "alloy", "echo", "fable", "onyx", "nova", "shimmer",
    # FPT AI Vietnamese voices — Miền Bắc
    "banmai", "leminh", "thuminh", "giahuy",
    # FPT AI Vietnamese voices — Miền Nam
    "lannhi", "minhquang", "ngoclam", "myan",
    # FPT AI Vietnamese voices — Miền Trung
    "linhsan", "camtu",
]
MODELS = ["tts-1", "tts-1-hd"]
LANGUAGES = ["auto", "en", "vi", "ja", "ko", "zh", "fr", "de", "es", "pt"]


class TTSGenerateRequest(BaseModel):
    text: str
    voice: str = "nova"
    model: str = "tts-1"
    language_hint: Optional[str] = None

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Text cannot be empty")
        if len(v) > 4096:
            raise ValueError("Text must be 4096 characters or less")
        return v

    @field_validator("voice")
    @classmethod
    def valid_voice(cls, v: str) -> str:
        if v not in VOICES:
            raise ValueError(f"Voice must be one of: {', '.join(VOICES)}")
        return v

    @field_validator("model")
    @classmethod
    def valid_model(cls, v: str) -> str:
        if v not in MODELS:
            raise ValueError(f"Model must be one of: {', '.join(MODELS)}")
        return v


class AudioAssetResponse(BaseModel):
    id: str
    text: str
    voice: str
    model: str
    language_hint: Optional[str]
    status: str
    local_path: Optional[str]
    file_size_bytes: Optional[int]
    duration_seconds: Optional[int]
    error_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AudioAssetList(BaseModel):
    items: list[AudioAssetResponse]
    total: int
