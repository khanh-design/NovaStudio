# AI YouTube Tool

Internal creator tool for AI-powered YouTube content generation.

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI + Python 3.11 |
| Queue | Celery + Redis |
| Database | PostgreSQL + SQLAlchemy 2.0 async |
| AI Provider | fal.ai (Flux, Kling) |
| Frontend | Next.js 15 + shadcn/ui + Tailwind |
| Deploy | Docker Compose |

## Quick Start

### 1. Setup environment

```bash
cp .env.example .env
# Fill in your FAL_KEY in .env
```

### 2. Start all services

```bash
docker-compose up --build
```

This starts:
- FastAPI backend → http://localhost:8000
- Next.js frontend → http://localhost:3000
- PostgreSQL → localhost:5432
- Redis → localhost:6379
- Celery worker (background)

### 3. Run database migrations

```bash
docker-compose exec backend alembic upgrade head
```

### 4. Open the app

- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

## Development

### Backend only (without Docker)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Start ONLY Postgres + Redis via Docker (backend runs locally)
docker-compose up -d postgres redis

# .env already exists at root — edit DATABASE_URL and REDIS_URL to use localhost
# (see comments in .env file)

uvicorn app.main:app --reload
```

### Frontend only (without Docker)

```powershell
cd frontend
npm install
npm run dev
# .env.local already exists (NEXT_PUBLIC_API_URL=http://localhost:8000)
```

### Run Celery worker locally

```bash
cd backend
celery -A celery_app worker --loglevel=info
```

## Project Structure

```
ai-youtube-tool/
├── backend/              # FastAPI + Celery
│   ├── app/
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   │   └── ai/       # Provider abstraction
│   │   └── workers/      # Celery tasks
│   └── alembic/          # DB migrations
├── frontend/             # Next.js dashboard
│   ├── app/              # App Router pages
│   ├── components/       # UI components
│   └── lib/              # API client + utils
└── storage/              # Local asset files
    ├── images/
    ├── videos/
    └── thumbnails/
```

## API

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/generate` | Trigger generation |
| `GET /api/v1/generations/{id}/status` | Poll status |
| `GET /api/v1/assets` | List assets |
| `GET /api/v1/assets/{id}/download` | Download asset |
| `GET /api/v1/projects` | List projects |
| `POST /api/v1/projects` | Create project |
| `GET /api/v1/assets/stats` | Dashboard stats |

Full API docs: http://localhost:8000/docs

## Roadmap

- [x] **Phase 1** — Core Generation (current)
- [ ] **Phase 2** — Content Workflow (prompt enhancement, batch, tagging)
- [ ] **Phase 3** — Video Production (ffmpeg, subtitles, voice)
- [ ] **Phase 4** — YouTube Automation (full pipeline)
