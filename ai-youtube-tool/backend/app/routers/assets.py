import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.asset import AssetResponse, AssetListResponse
from app.services import asset_service

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=AssetListResponse)
async def list_assets(
    project_id: uuid.UUID | None = Query(None),
    type: str | None = Query(None, pattern="^(image|video)$"),
    status: str | None = Query(None, pattern="^(pending|generating|completed|failed)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    skip = (page - 1) * page_size
    items, total = await asset_service.list_assets(
        db, project_id=project_id, asset_type=type, status=status, skip=skip, limit=page_size
    )
    return AssetListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    return await asset_service.get_dashboard_stats(db)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    asset = await asset_service.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get("/{asset_id}/download")
async def download_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    asset = await asset_service.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.status != "completed" or not asset.local_path:
        raise HTTPException(status_code=400, detail="Asset is not ready for download")
    if not Path(asset.local_path).exists():
        raise HTTPException(status_code=404, detail="Asset file not found on disk")

    filename = f"{asset.type}_{asset.id}{Path(asset.local_path).suffix}"
    return FileResponse(
        path=asset.local_path,
        filename=filename,
        media_type="application/octet-stream",
    )


@router.delete("/{asset_id}", status_code=204)
async def delete_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    asset = await asset_service.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    await asset_service.delete_asset(db, asset)
