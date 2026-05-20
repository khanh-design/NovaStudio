import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.asset import GenerateRequest, AssetResponse
from app.schemas.generation import GenerationStatusResponse
from app.services import asset_service, generation_service
from app.config import get_settings

settings = get_settings()
router = APIRouter(tags=["Generations"])


@router.post("/generate", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def trigger_generation(
    data: GenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a generation request.
    Returns immediately with asset_id + generation_id.
    Actual generation runs in background via Celery.
    """
    from app.workers.generation_worker import generate_asset

    # Create asset record
    asset = await asset_service.create_asset(db, data)

    # Create generation record
    generation = await generation_service.create_generation(db, asset, provider=settings.ai_provider)
    await db.commit()

    # Dispatch Celery task
    generate_asset.delay(str(asset.id), str(generation.id))

    return {
        "message": "Generation queued",
        "asset_id": str(asset.id),
        "generation_id": str(generation.id),
        "status": "pending",
    }


@router.get("/generations/{generation_id}/status", response_model=GenerationStatusResponse)
async def get_generation_status(
    generation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Lightweight status check for polling from frontend."""
    generation = await generation_service.get_generation(db, generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")

    asset = await asset_service.get_asset(db, generation.asset_id)

    return GenerationStatusResponse(
        generation_id=generation.id,
        asset_id=generation.asset_id,
        status=generation.status,
        asset_status=asset.status if asset else "unknown",
        error_message=generation.error_message,
        local_path=asset.local_path if asset else None,
        thumbnail_path=asset.thumbnail_path if asset else None,
    )
