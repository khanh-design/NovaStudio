import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generation import Generation
from app.models.asset import Asset


async def create_generation(
    db: AsyncSession,
    asset: Asset,
    provider: str,
) -> Generation:
    generation = Generation(
        asset_id=asset.id,
        provider=provider,
        model=asset.model,
        status="queued",
    )
    db.add(generation)
    await db.flush()
    await db.refresh(generation)
    return generation


async def get_generation(db: AsyncSession, generation_id: uuid.UUID) -> Generation | None:
    result = await db.execute(select(Generation).where(Generation.id == generation_id))
    return result.scalar_one_or_none()


async def update_generation(
    db: AsyncSession,
    generation: Generation,
    status: str,
    provider_request_id: str | None = None,
    generation_time_ms: int | None = None,
    cost_usd: float | None = None,
    error_message: str | None = None,
    request_payload: dict | None = None,
    response_payload: dict | None = None,
) -> Generation:
    generation.status = status
    if provider_request_id:
        generation.provider_request_id = provider_request_id
    if generation_time_ms is not None:
        generation.generation_time_ms = generation_time_ms
    if cost_usd is not None:
        generation.cost_usd = cost_usd
    if error_message:
        generation.error_message = error_message
    if request_payload:
        generation.request_payload = request_payload
    if response_payload:
        generation.response_payload = response_payload
    if status in ("completed", "failed", "cancelled"):
        generation.completed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(generation)
    return generation
