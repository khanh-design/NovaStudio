"""
Publish generation status changes to Redis pub/sub.

Workers import this to notify WebSocket clients of status updates.
"""

import json
import logging
import redis

from app.config import get_settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def _get_redis():
    """Lazy-init sync Redis client for worker context."""
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def notify_status_change(
    asset_id: str,
    generation_id: str,
    status: str,
    asset_type: str | None = None,
    error: str | None = None,
):
    """Publish a generation status change to Redis pub/sub.

    Called from Celery workers when generation status changes.
    WebSocket clients listening on 'generation_status' channel will receive this.
    """
    message = {
        "type": "generation_update",
        "asset_id": asset_id,
        "generation_id": generation_id,
        "status": status,
    }
    if asset_type:
        message["asset_type"] = asset_type
    if error:
        message["error"] = error

    try:
        r = _get_redis()
        r.publish("generation_status", json.dumps(message))
        logger.debug(f"Published status change: {status} for asset {asset_id}")
    except Exception as e:
        # Non-critical: log and continue (polling still works as fallback)
        logger.warning(f"Failed to publish status change: {e}")
