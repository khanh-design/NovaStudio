"""
WebSocket endpoint for real-time generation status updates.

Uses Redis pub/sub: workers publish status changes,
WebSocket endpoint subscribes and pushes to connected clients.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections and Redis pub/sub."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send message to all connected clients."""
        data = json.dumps(message)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(data)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.active_connections.remove(conn)


manager = ConnectionManager()


async def redis_subscriber():
    """Subscribe to Redis pub/sub channel and broadcast to WebSocket clients."""
    import redis.asyncio as aioredis

    settings = get_settings()
    redis_url = settings.redis_url

    r = aioredis.from_url(redis_url, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe("generation_status")

    logger.info("Redis subscriber started on 'generation_status' channel")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await manager.broadcast(data)
                except (json.JSONDecodeError, Exception) as e:
                    logger.warning(f"Failed to broadcast message: {e}")
    except asyncio.CancelledError:
        await pubsub.unsubscribe("generation_status")
        await r.close()
        raise
    except Exception as e:
        logger.error(f"Redis subscriber error: {e}")
        await r.close()


# Background task ref to keep subscriber alive
_subscriber_task: asyncio.Task | None = None


def start_subscriber():
    """Start Redis subscriber as background asyncio task."""
    global _subscriber_task
    if _subscriber_task is None or _subscriber_task.done():
        _subscriber_task = asyncio.create_task(redis_subscriber())
        logger.info("Started Redis pub/sub subscriber task")


@router.websocket("/ws/generations")
async def websocket_generations(websocket: WebSocket):
    """WebSocket endpoint for real-time generation status updates."""
    # Ensure subscriber is running
    start_subscriber()

    await manager.connect(websocket)
    try:
        # Keep connection open, listen for client messages (heartbeat/ping)
        while True:
            data = await websocket.receive_text()
            # Client can send "ping" for keep-alive
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
