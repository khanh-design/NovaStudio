# AI YouTube Generation Tool — Recommended Architecture (V1)

## Mục tiêu thực tế của hệ thống

Tool này KHÔNG phải SaaS public lớn.

Mục tiêu thật:

- Tạo video AI chất lượng cao để làm YouTube
- Tạo image/video theo batch
- Quản lý asset AI đã generate
- Workflow ổn định, dễ maintain
- Tối ưu chất lượng output hơn là scale enterprise
- Có thể mở rộng dần sau này

---

# Triết lý thiết kế mới

## Ưu tiên

1. Chất lượng video
2. Workflow làm content
3. Dễ maintain
4. Ít bug
5. Tốc độ phát triển nhanh
6. Dễ mở rộng sau này

## Không ưu tiên ở giai đoạn đầu

- Microservice phức tạp
- Multi-tenant SaaS
- Scale hàng nghìn user
- Distributed architecture
- Kubernetes
- Event-driven system phức tạp

---

# Architecture Recommendation

## Chuyển từ Microservice → Modular Monolith

## KHÔNG nên dùng lúc này

- api-service riêng
- image-service riêng
- video-service riêng
- notification-service riêng

Lý do:

- Over-engineering
- Debug khó
- Nhiều bug distributed system
- Không giúp video generate nhanh hơn
- Khó maintain khi chỉ có 1 người phát triển

---

# Architecture Recommended

```txt
Frontend (Next.js)
        ↓
FastAPI Backend
        ↓
Redis Queue
        ↓
Celery Worker
        ↓
fal.ai
        ↓
Asset Storage
        ↓
PostgreSQL
```

---

# Recommended Stack

| Thành phần | Recommendation |
|---|---|
| Backend | FastAPI |
| Queue | Celery |
| Broker | Redis |
| Database | PostgreSQL |
| Frontend | Next.js |
| AI Provider | fal.ai |
| Video Processing | ffmpeg |
| Storage | Local disk trước |
| Deploy | Docker Compose |
| Reverse Proxy | Nginx |

---

# Vì sao PostgreSQL tốt hơn MySQL

## PostgreSQL phù hợp AI workflow hơn

Ưu điểm:

- JSON support tốt hơn
- Query metadata mạnh hơn
- Search prompt dễ hơn
- Full-text search tốt hơn
- Async ecosystem mạnh
- Dễ scale hơn sau này

---

# Kiến trúc Folder Structure Recommended

```txt
project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── storage/
│   │   │   ├── video/
│   │   │   ├── image/
│   │   │   ├── prompt/
│   │   │   └── websocket/
│   │   ├── workers/
│   │   └── utils/
│   │
│   ├── celery_app.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── storage/
│   ├── videos/
│   ├── images/
│   ├── thumbnails/
│   └── temp/
│
├── docker-compose.yml
└── .env
```

---

# Hệ thống thực tế nên tập trung vào gì?

## Không phải queue system.

## Mà là:

# 1. Video Quality Pipeline

Đây là phần quan trọng nhất.

Video AI chất lượng cao phụ thuộc:

- Prompt engineering
- Cinematic prompting
- Camera movement
- Lighting
- Motion consistency
- Seed consistency
- Character consistency
- Post-processing

---

# 2. Prompt Enhancement System

## Input user:

```txt
A girl walking in Tokyo
```

## Prompt enhance:

```txt
cinematic shot of a young japanese woman walking through neon-lit Tokyo streets at night, realistic lighting, film grain, ultra detailed, smooth camera movement, shallow depth of field, 35mm cinema lens
```

## Đây là nơi tạo khác biệt chất lượng.

---

# 3. Asset Management

Hệ thống phải quản lý:

- video
- image
- thumbnail
- prompt
- metadata
- tags
- project
- scene

Không chỉ là “job”.

---

# Database Design Recommended

## projects

```sql
projects
- id
- name
- description
- created_at
```

## assets

```sql
assets
- id
- project_id
- type (video/image)
- prompt
- enhanced_prompt
- model
- aspect_ratio
- duration
- resolution
- local_path
- thumbnail_path
- status
- metadata_json
- created_at
```

## generations

```sql
generations
- id
- asset_id
- provider
- provider_request_id
- generation_time
- cost
- status
- error_message
```

---

# Queue Architecture

## Giữ Celery + Redis

Vì AI generation là background workload.

## Nhưng dùng đơn giản:

```txt
FastAPI
   ↓
Celery Queue
   ↓
Worker
   ↓
fal.ai
```

## Không cần:

- nhiều microservice
- pub/sub phức tạp
- distributed websocket service

---

# Realtime Update

## Chỉ cần:

FastAPI WebSocket trực tiếp.

Không cần notification-service riêng.

---

# AI Models Recommended

| Task | Model |
|---|---|
| Cinematic video | Kling Pro |
| Fast generation | Hailuo |
| Realistic image | Flux |
| Consistent style | SDXL |
| Thumbnail image | Imagen |

---

# Vấn đề lớn nhất của AI Video

## Character Consistency

Ví dụ:

- đổi mặt
- đổi tóc
- đổi quần áo
- đổi background

## Hệ thống cần chuẩn bị:

- seed locking
- reference image
- character profile
- storyboard flow
- scene continuity

---

# Post-processing Pipeline

## Đây là phần cực quan trọng.

Tool nên có:

- ffmpeg normalize
- auto thumbnail
- upscale
- frame interpolation
- concat clips
- subtitle burn
- export MP4

---

# YouTube Workflow Thực tế

## Workflow đúng không phải:

```txt
Prompt → Video
```

## Mà là:

```txt
Idea
 → Script
 → Scene Breakdown
 → Prompt Enhancement
 → Image Generation
 → Video Generation
 → Upscale
 → Voice
 → Subtitle
 → Final Export
```

---

# Roadmap Recommended

# Phase 1 — Core Generation

- Prompt → generate image/video
- Save asset
- Download asset
- Basic dashboard
- Queue system

---

# Phase 2 — Content Workflow

- Project management
- Scene management
- Prompt enhancement
- Asset tagging
- Thumbnail system

---

# Phase 3 — Video Production

- ffmpeg pipeline
- Auto subtitle
- Clip stitching
- Transition system
- Voice integration

---

# Phase 4 — AI YouTube Automation

- Script → scenes
- Auto prompting
- Auto voice
- Auto assembly
- Final video export

---

# Infrastructure Recommendation

## Giai đoạn đầu

```txt
1 VPS
- FastAPI
- Celery
- Redis
- PostgreSQL
- Frontend
```

Là đủ.

---

# Không nên tối ưu quá sớm

Hiện tại KHÔNG cần:

- Kubernetes
- Kafka
- NATS
- Event sourcing
- Distributed tracing
- Multi-region
- Service mesh

---

# Điều quan trọng nhất

## Thành công của tool này KHÔNG phụ thuộc:

- microservice
- queue phức tạp
- enterprise architecture

## Mà phụ thuộc:

- chất lượng prompt
- cinematic workflow
- consistency
- post-processing
- content pipeline
- tốc độ iteration

---

# Final Recommendation

## Giữ

- FastAPI
- Celery
- Redis
- MySQL
- Next.js
- Docker Compose
- fal.ai

## Loại bỏ

- notification-service riêng
- microservice quá sớm
- distributed complexity
- SaaS-first architecture

## Tập trung

- video quality
- prompt engineering
- cinematic pipeline
- asset workflow
- AI content production
- YouTube automation

