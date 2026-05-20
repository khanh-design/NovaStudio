import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.asset import Asset
from app.schemas.project import ProjectCreate, ProjectUpdate


async def list_projects(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[dict]:
    result = await db.execute(
        select(
            Project,
            func.count(Asset.id).label("asset_count"),
            func.count(Asset.id).filter(Asset.status == "completed").label("completed_count"),
        )
        .outerjoin(Asset, Asset.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    rows = result.all()
    return [
        {**row.Project.__dict__, "asset_count": row.asset_count, "completed_count": row.completed_count}
        for row in rows
    ]


async def get_project(db: AsyncSession, project_id: uuid.UUID) -> Project | None:
    result = await db.execute(select(Project).where(Project.id == project_id))
    return result.scalar_one_or_none()


async def create_project(db: AsyncSession, data: ProjectCreate) -> Project:
    project = Project(name=data.name, description=data.description)
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def update_project(db: AsyncSession, project: Project, data: ProjectUpdate) -> Project:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.flush()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project: Project) -> None:
    await db.delete(project)
