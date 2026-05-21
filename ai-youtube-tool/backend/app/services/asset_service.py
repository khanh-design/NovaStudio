import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.asset import Asset
from app.schemas.asset import GenerateRequest

settings = get_settings()


async def list_assets(
    db: AsyncSession,
    project_id: uuid.UUID | None = None,
    asset_type: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Asset], int]:
    query = select(Asset)
    count_query = select(Asset)

    if project_id:
        query = query.where(Asset.project_id == project_id)
        count_query = count_query.where(Asset.project_id == project_id)
    if asset_type:
        query = query.where(Asset.type == asset_type)
        count_query = count_query.where(Asset.type == asset_type)
    if status:
        query = query.where(Asset.status == status)
        count_query = count_query.where(Asset.status == status)

    from sqlalchemy import func
    total_result = await db.execute(select(func.count()).select_from(count_query.subquery()))
    total = total_result.scalar_one()

    query = query.order_by(Asset.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all(), total


async def get_asset(db: AsyncSession, asset_id: uuid.UUID) -> Asset | None:
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    return result.scalar_one_or_none()


async def create_asset(db: AsyncSession, data: GenerateRequest) -> Asset:
    # Build metadata including audio settings for video
    meta: dict = {}
    if data.type == "video":
        meta["add_audio"] = data.add_audio
        if data.audio_prompt:
            meta["audio_prompt"] = data.audio_prompt

    asset = Asset(
        project_id=data.project_id,
        type=data.type,
        prompt=data.prompt,
        model=data.model,
        aspect_ratio=data.aspect_ratio,
        duration=data.duration,
        resolution=data.resolution,
        status="pending",
        metadata_json=meta,
    )
    db.add(asset)
    await db.flush()
    await db.refresh(asset)
    return asset


async def update_asset_status(
    db: AsyncSession,
    asset: Asset,
    status: str,
    local_path: str | None = None,
    thumbnail_path: str | None = None,
    file_size_bytes: int | None = None,
) -> Asset:
    asset.status = status
    if local_path is not None:
        asset.local_path = local_path
    if thumbnail_path is not None:
        asset.thumbnail_path = thumbnail_path
    if file_size_bytes is not None:
        asset.file_size_bytes = file_size_bytes
    await db.flush()
    await db.refresh(asset)
    return asset


async def delete_asset(db: AsyncSession, asset: Asset) -> None:
    # Clean up local files
    if asset.local_path and Path(asset.local_path).exists():
        Path(asset.local_path).unlink(missing_ok=True)
    if asset.thumbnail_path and Path(asset.thumbnail_path).exists():
        Path(asset.thumbnail_path).unlink(missing_ok=True)
    await db.delete(asset)


async def get_dashboard_stats(db: AsyncSession) -> dict:
    from sqlalchemy import func
    result = await db.execute(
        select(
            func.count(Asset.id).label("total"),
            func.count(Asset.id).filter(Asset.status == "completed").label("completed"),
            func.count(Asset.id).filter(Asset.status == "generating").label("generating"),
            func.count(Asset.id).filter(Asset.status == "failed").label("failed"),
            func.count(Asset.id).filter(Asset.type == "image").label("images"),
            func.count(Asset.id).filter(Asset.type == "video").label("videos"),
        )
    )
    row = result.one()
    return {
        "total_assets": row.total,
        "completed": row.completed,
        "generating": row.generating,
        "failed": row.failed,
        "images": row.images,
        "videos": row.videos,
    }
