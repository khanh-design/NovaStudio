"""
Multi-provider TTS service.
- OpenAI TTS: English-optimized voices (alloy, nova, shimmer...)
- FPT AI TTS: Vietnamese-optimized voices (giọng Bắc/Nam/Trung)
"""
import asyncio
import httpx
from pathlib import Path

from openai import OpenAI
from app.config import get_settings

settings = get_settings()

# ------------------------------------------------------------------
# FPT AI voice catalog — giọng tiếng Việt chuẩn
# Docs: https://fpt.ai/tts
# ------------------------------------------------------------------
FPT_VOICES = {
    # Giọng miền Bắc (Northern)
    "banmai":    {"label": "Ban Mai",    "region": "Bắc", "gender": "female"},
    "leminh":    {"label": "Lê Minh",   "region": "Bắc", "gender": "male"},
    "thuminh":   {"label": "Thu Minh",  "region": "Bắc", "gender": "female"},
    "giahuy":    {"label": "Gia Huy",   "region": "Bắc", "gender": "male"},
    # Giọng miền Nam (Southern)
    "lannhi":    {"label": "Lan Nhi",   "region": "Nam", "gender": "female"},
    "minhquang": {"label": "Minh Quang","region": "Nam", "gender": "male"},
    "ngoclam":   {"label": "Ngọc Lam",  "region": "Nam", "gender": "female"},
    "myan":      {"label": "Mỹ An",     "region": "Nam", "gender": "female"},
    # Giọng miền Trung (Central)
    "linhsan":   {"label": "Linh San",  "region": "Trung", "gender": "female"},
    "camtu":     {"label": "Cẩm Tú",   "region": "Trung", "gender": "female"},
}

# OpenAI voices (English-optimized, multilingual)
OPENAI_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]


class OpenAITTSProvider:
    """OpenAI TTS — best for English, passable for other languages."""

    def __init__(self):
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")
        self.client = OpenAI(api_key=settings.openai_api_key)

    async def generate_speech(self, text: str, voice: str, model: str, save_path: str) -> str:
        def _run():
            Path(save_path).parent.mkdir(parents=True, exist_ok=True)
            response = self.client.audio.speech.create(
                model=model,
                voice=voice,
                input=text,
                response_format="mp3",
            )
            response.stream_to_file(save_path)
            return save_path

        return await asyncio.to_thread(_run)


class FptTTSProvider:
    """
    FPT AI TTS — Vietnamese regional voices (Bắc/Nam/Trung).
    API docs: https://docs.fpt.ai/docs/tts/v5/
    """
    API_URL = "https://api.fpt.ai/hmi/tts/v5"

    def __init__(self):
        if not settings.fpt_tts_key:
            raise ValueError("FPT_TTS_KEY is not configured. Get key at fpt.ai")
        self.api_key = settings.fpt_tts_key

    async def generate_speech(self, text: str, voice: str, save_path: str) -> str:
        """
        Call FPT AI TTS API and save MP3 to save_path.
        Returns save_path.
        """
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                self.API_URL,
                headers={
                    "api-key": self.api_key,
                    "voice": voice,
                    "speed": "",        # default speed
                    "Content-Type": "application/json",
                },
                content=text.encode("utf-8"),
            )
            response.raise_for_status()
            data = response.json()

            # FPT returns {"async": "url_to_mp3_file"}
            audio_url = data.get("async")
            if not audio_url:
                raise ValueError(f"FPT TTS returned no audio URL: {data}")

            # Download the MP3 file
            # FPT generates the file async — may need brief wait
            for attempt in range(6):
                await asyncio.sleep(2)
                dl = await client.get(audio_url)
                if dl.status_code == 200 and dl.content:
                    with open(save_path, "wb") as f:
                        f.write(dl.content)
                    return save_path

            raise TimeoutError("FPT TTS: audio file not ready after 12 seconds")


class TTSProvider:
    """
    Unified TTS provider — routes to FPT AI or OpenAI based on voice selection.
    FPT voices (banmai, leminh...) → FptTTSProvider
    OpenAI voices (alloy, nova...) → OpenAITTSProvider
    """

    def __init__(self, voice: str):
        self.voice = voice
        if voice in FPT_VOICES:
            self._backend = FptTTSProvider()
            self._is_fpt = True
        else:
            self._backend = OpenAITTSProvider()
            self._is_fpt = False

    async def generate_speech(
        self,
        text: str,
        voice: str,
        model: str,
        save_path: str,
    ) -> str:
        if self._is_fpt:
            return await self._backend.generate_speech(text, voice, save_path)
        return await self._backend.generate_speech(text, voice, model, save_path)
