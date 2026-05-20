from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "aitube",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.generation_worker"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Result expiry (24h)
    result_expires=86400,
    # Worker settings
    worker_prefetch_multiplier=1,   # Process one task at a time per worker
    task_track_started=True,
)
