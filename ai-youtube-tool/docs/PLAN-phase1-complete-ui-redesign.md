# Phase 1 Hoàn Thiện + UI Redesign — AI YouTube Tool

## Goal

Hoàn thiện Phase 1 Core Generation (fix bugs, thêm WebSocket, tests) và redesign toàn bộ UI thành premium dark-theme studio interface. Chạy local (localhost), không cần authentication.

## Project Type: WEB (Next.js 15 + FastAPI)

## Success Criteria

- [ ] Tất cả bugs P0 được fix (asyncio deprecation, AudioAsset inconsistency)
- [ ] WebSocket realtime thay thế polling 5s
- [ ] UI redesign hoàn chỉnh — premium, cinematic, professional
- [ ] Backend + Frontend chạy stable không lỗi
- [ ] Tất cả pages hoạt động đúng với data thật

---

## Tech Stack

| Layer | Current | Change? |
|-------|---------|---------|
| Backend | FastAPI + Python 3.11 | ✅ Giữ nguyên |
| Queue | Celery + Redis | ✅ Giữ nguyên |
| Database | PostgreSQL + SQLAlchemy 2.0 async | ✅ Giữ nguyên |
| AI Provider | fal.ai (Flux, Kling) | ✅ Giữ nguyên |
| Frontend | Next.js 15 + Tailwind v3 | ⚠️ Redesign components |
| UI Library | shadcn/ui (partially used) | ✅ Keep + extend |
| Realtime | Polling (5s interval) | 🔄 → WebSocket |
| Font | Inter (system) | 🔄 → Google Fonts Inter (proper import) |

---

## Tasks

### 🔴 MILESTONE 1: Backend Bug Fixes (P0)

- [ ] **T1: Fix `asyncio.get_event_loop()` deprecation in workers**
  - Files: `backend/app/workers/generation_worker.py`, `backend/app/workers/tts_worker.py`
  - Action: Replace `run_async()` helper → use `asyncio.run()` or create new event loop properly
  - Why: `get_event_loop()` is deprecated Python 3.10+, will crash 3.12+
  - Verify: `celery -A celery_app worker` starts without DeprecationWarning, generate an image successfully

- [ ] **T2: Unify AudioAsset model style + add project_id FK**
  - Files: `backend/app/models/audio_asset.py`, `backend/app/models/__init__.py`
  - Action:
    1. Rewrite AudioAsset using `Mapped[]` + `mapped_column()` (match Asset/Project style)
    2. Add `project_id` FK (nullable) to `audio_assets` table
    3. Export AudioAsset in `__init__.py`
    4. Create Alembic migration
  - Verify: `alembic upgrade head` runs clean, TTS generation still works

- [ ] **T3: Extract TTS router logic to service layer**
  - Files: `backend/app/routers/tts.py` → new `backend/app/services/audio_service.py`
  - Action: Move DB queries from router to service layer (matching pattern of asset_service, project_service)
  - Verify: All TTS endpoints return same responses as before

### 🟡 MILESTONE 2: WebSocket Realtime

- [ ] **T4: Add WebSocket endpoint for generation status**
  - Files: new `backend/app/routers/ws.py`, update `backend/app/main.py`
  - Action:
    1. Create FastAPI WebSocket endpoint at `/ws/generations`
    2. When generation status changes in worker → publish to Redis pub/sub
    3. WebSocket endpoint subscribes to Redis pub/sub → push to connected clients
  - Verify: Connect via browser WebSocket → trigger generation → receive status updates in real-time

- [ ] **T5: Frontend WebSocket client**
  - Files: new `frontend/lib/websocket.ts`, new `frontend/hooks/useGenerationStatus.ts`
  - Action:
    1. Create WebSocket client with auto-reconnect
    2. Create React hook `useGenerationStatus()` that listens for status updates
    3. Replace polling logic in `asset-gallery.tsx` and `audio/page.tsx`
  - Verify: Generate image → gallery auto-updates without 5s delay

### 🟢 MILESTONE 3: UI Redesign — Design System

- [ ] **T6: New design system — globals.css + design tokens**
  - Files: `frontend/app/globals.css`, `frontend/tailwind.config.ts`
  - Action: Redesign color palette:
    - Deep space dark background (not just dark gray)
    - Cyan/teal primary accent (cinematic, creative studio feel)
    - Warm gradient highlights
    - Glassmorphism cards (backdrop-blur, semi-transparent borders)
    - Smooth transitions + micro-animations
    - Custom scrollbar matching theme
    - Google Fonts Inter properly imported
  - Verify: App loads with new color system, no broken styles

- [ ] **T7: Redesign Sidebar — collapsible + animated**
  - Files: `frontend/components/layout/sidebar.tsx`
  - Action:
    1. Collapsible sidebar (icon-only mode on click)
    2. Active route indicator with animated bar
    3. Logo area with gradient brand mark
    4. Hover tooltips in collapsed mode
    5. Bottom section: version info + collapse toggle
    6. Mobile: hamburger menu overlay
  - Verify: Sidebar collapses/expands, mobile hamburger works, active route highlighted

- [ ] **T8: Redesign Dashboard page**
  - Files: `frontend/app/page.tsx`, `frontend/components/stat-card.tsx`
  - Action:
    1. Hero header with gradient text + animated particles/dots
    2. Stat cards: glassmorphism + gradient borders + animated counters + icons with glow
    3. Quick Generate panel with glassmorphic card
    4. Recent Assets as horizontal scroll carousel
    5. Activity feed / generation timeline
  - Verify: Dashboard loads, stats display correctly, animations smooth

- [ ] **T9: Redesign Generation Form**
  - Files: `frontend/components/generation-form.tsx`
  - Action:
    1. Card with gradient header bar
    2. Type toggle: pill-style with animated slide indicator
    3. Prompt textarea: auto-resize, character count with animated ring
    4. Model selector: visual cards instead of dropdown (show model icon/preview)
    5. Aspect ratio: visual preview boxes (show ratio shape)
    6. Duration selector: slider instead of dropdown
    7. Audio section: expandable panel with smooth animation
    8. Submit button: gradient + loading shimmer animation
  - Verify: All form fields functional, generate image + video works

- [ ] **T10: Redesign Asset Gallery + Asset Card**
  - Files: `frontend/components/asset-gallery.tsx`, `frontend/components/asset-card.tsx`
  - Action:
    1. Gallery: masonry or uniform grid with smooth stagger animation on load
    2. Filter toolbar: pill-style tabs with count badges
    3. Asset card:
       - Rounded corners with border glow on hover
       - Smooth thumbnail zoom on hover
       - Overlay with blur + action buttons (download, delete, fullscreen)
       - Status: animated progress ring for generating, subtle pulse for pending
       - Type badge: gradient pill
       - Prompt preview with expand on click
    4. Lightbox: click thumbnail → fullscreen modal with video player
    5. Empty state: illustrated placeholder
  - Verify: Assets display correctly, hover effects smooth, download works, lightbox opens

- [ ] **T11: Redesign Generate Page (full page)**
  - Files: `frontend/app/generate/page.tsx`
  - Action:
    1. Page header with breadcrumb
    2. Two-column layout: sticky form on left, scrollable gallery on right
    3. Tips section with collapsible accordion style
    4. Visual separation between sections
  - Verify: Page loads, form sticky on scroll, responsive on mobile

- [ ] **T12: Redesign Audio TTS Page**
  - Files: `frontend/app/audio/page.tsx`, `frontend/components/tts-form.tsx`, `frontend/components/audio-card.tsx`
  - Action:
    1. Voice selector: visual cards with waveform icon, play sample button
    2. Vietnamese voices: region-colored cards with flag emoji
    3. OpenAI voices: personality description cards
    4. Audio card: waveform visualization, inline player with progress bar
    5. Audio library: grid with sort options
  - Verify: TTS generate works, audio plays inline, Vietnamese voices render correctly

- [ ] **T13: Redesign Projects Page + Project Detail**
  - Files: `frontend/app/projects/page.tsx`, `frontend/app/projects/[id]/page.tsx`
  - Action:
    1. Projects grid: large cards with thumbnail preview (from latest asset)
    2. Asset count + completion progress bar
    3. Create project: modal dialog with animation
    4. Project detail: breadcrumb nav, project info header, tabbed content
    5. Delete project: confirmation dialog with warning
  - Verify: Create project, navigate to detail, generate asset in project context

### 🔵 MILESTONE 4: Polish & Quality

- [ ] **T14: Add toast notification system**
  - Files: new `frontend/components/ui/toaster.tsx`, update `frontend/app/layout.tsx`
  - Action: Implement toast for success/error feedback (use Radix Toast already in package.json)
  - Verify: Generate → toast shows "Queued!", error → toast shows error message

- [ ] **T15: Responsive mobile layout**
  - Files: All page + component files
  - Action:
    1. Sidebar → hamburger overlay on mobile
    2. Grid layouts → single column on small screens
    3. Form → full-width
    4. Gallery → 2-column on tablet, 1-column on phone
  - Verify: App usable on 375px viewport (iPhone SE)

- [ ] **T16: Loading & error states audit**
  - Files: All pages
  - Action:
    1. Skeleton loading for every page (not just gallery)
    2. Error boundaries with friendly messages
    3. Empty states with illustrations
    4. Retry buttons on all error states
  - Verify: Kill backend → frontend shows connection error. Start backend → auto-recovers

---

## Dependencies & Execution Order

```
T1 ──┐
T2 ──┤── Backend fixes (parallel)
T3 ──┘
      ↓
T4 ── T5 ── WebSocket (serial: backend → frontend)
      ↓
T6 ── Design System (foundation for all UI)
      ↓
T7 ──────── Sidebar (first visible change)
      ↓
T8 ──┐
T9 ──┤
T10 ─┤── Page Redesigns (parallel after T6/T7)
T11 ─┤
T12 ─┤
T13 ─┘
      ↓
T14 ─┐
T15 ─┤── Polish (parallel)
T16 ─┘
```

**Critical Path:** T1 → T4 → T5 → T6 → T8/T9/T10 → T14/T15

---

## Agent Assignments

| Task | Agent | Skills |
|------|-------|--------|
| T1-T3 | `backend-specialist` | clean-code, python-patterns |
| T4 | `backend-specialist` | api-patterns |
| T5 | `frontend-specialist` | react-best-practices |
| T6-T13 | `frontend-specialist` | frontend-design, tailwind-patterns |
| T14-T16 | `frontend-specialist` | frontend-design, web-design-guidelines |

---

## Phase X: Verification Checklist

- [ ] Backend starts without warnings: `uvicorn app.main:app --reload`
- [ ] Celery worker starts: `celery -A celery_app worker --loglevel=info`
- [ ] Generate image → completes → shows in gallery (via WebSocket)
- [ ] Generate video → completes → shows with thumbnail (via WebSocket)
- [ ] TTS generate → audio plays inline
- [ ] All 5 pages render correctly (Dashboard, Generate, Audio, Projects, Project Detail)
- [ ] Create/delete project works
- [ ] Asset download works
- [ ] Mobile viewport (375px) is usable
- [ ] No console errors in browser
- [ ] `npm run build` passes without errors

---

## Risk Areas

| Risk | Mitigation |
|------|-----------|
| WebSocket + Celery Redis pub/sub complexity | Start with simple approach: worker writes to Redis channel, WS endpoint subscribes |
| UI redesign breaks existing functionality | Test each page after redesign before moving to next |
| Alembic migration for AudioAsset | Test migration on fresh DB + existing DB with data |
| Tailwind config changes break existing styles | Replace design tokens gradually, test each page |

---

## Estimated Effort

| Milestone | Tasks | Est. Time |
|-----------|-------|-----------|
| Backend Bug Fixes | T1-T3 | ~1 hour |
| WebSocket | T4-T5 | ~2 hours |
| UI Redesign | T6-T13 | ~6-8 hours |
| Polish | T14-T16 | ~2 hours |
| **Total** | **16 tasks** | **~11-13 hours** |
