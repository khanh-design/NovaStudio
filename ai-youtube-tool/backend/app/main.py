from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import engine, Base
from app.routers import projects, assets, generations, tts

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # NOTE: Schema is managed by Alembic migrations.
    # Run: docker-compose exec backend alembic upgrade head
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="AI YouTube Tool",
    description="Internal creator tool for AI-powered YouTube content generation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory=settings.storage_base_path), name="storage")

app.include_router(projects.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(generations.router, prefix="/api/v1")
app.include_router(tts.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/", tags=["Health"])
async def root():
    return {"message": "AI YouTube Tool API", "docs": "/docs"}
