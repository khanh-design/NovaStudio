from app.config import get_settings
from app.services.ai.base import AIProvider
from app.services.ai.fal_provider import FalProvider

settings = get_settings()

_provider_instance: AIProvider | None = None


def get_provider() -> AIProvider:
    """
    Factory function: returns the configured AI provider singleton.
    Add new providers here as elif branches.
    """
    global _provider_instance
    if _provider_instance is None:
        provider_name = settings.ai_provider.lower()
        if provider_name == "fal":
            _provider_instance = FalProvider()
        else:
            raise ValueError(f"Unknown AI provider: '{provider_name}'. Supported: fal")
    return _provider_instance
