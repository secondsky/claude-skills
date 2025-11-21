# Python WebSocket Implementation

## aiohttp WebSocket Server

```python
from aiohttp import web, WSMsgType
import asyncio
import json

# NOTE: verify_token() is application-specific and must be implemented
# Example implementation:
# def verify_token(token):
#     """Verify JWT token and return user_id, or None if invalid"""
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
#         return payload.get('user_id')
#     except jwt.InvalidTokenError:
#         return None
#
# Or import from your auth module:
# from auth import verify_token

class WebSocketManager:
    def __init__(self):
        self.connections = {}  # user_id -> websocket
        self.rooms = {}        # room_id -> set of user_ids

    async def connect(self, user_id, ws):
        self.connections[user_id] = ws

    async def disconnect(self, user_id):
        if user_id in self.connections:
            del self.connections[user_id]
        # Remove from all rooms
        for room_id, members in self.rooms.items():
            members.discard(user_id)

    async def join_room(self, user_id, room_id):
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(user_id)

    async def broadcast_to_room(self, room_id, message, exclude=None):
        if room_id not in self.rooms:
            return
        for user_id in self.rooms[room_id]:
            if user_id != exclude and user_id in self.connections:
                ws = self.connections[user_id]
                await ws.send_json(message)

manager = WebSocketManager()

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    # Authenticate
    token = request.query.get('token')
    user_id = verify_token(token)
    if not user_id:
        await ws.close(code=4001, message='Unauthorized')
        return ws

    await manager.connect(user_id, ws)

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                data = json.loads(msg.data)

                if data['type'] == 'join':
                    await manager.join_room(user_id, data['roomId'])

                elif data['type'] == 'message':
                    await manager.broadcast_to_room(
                        data['roomId'],
                        {
                            'type': 'message',
                            'userId': user_id,
                            'content': data['content'],
                            'timestamp': time.time()
                        },
                        exclude=user_id
                    )

            elif msg.type == WSMsgType.ERROR:
                print(f'WebSocket error: {ws.exception()}')

    finally:
        await manager.disconnect(user_id)

    return ws

app = web.Application()
app.router.add_get('/ws', websocket_handler)
```

## FastAPI WebSocket

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set
import json

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.rooms: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast_room(self, room_id: str, message: dict):
        if room_id in self.rooms:
            for user_id in self.rooms[room_id]:
                await self.send_personal(message, user_id)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()

            if data['action'] == 'join_room':
                room_id = data['room_id']
                if room_id not in manager.rooms:
                    manager.rooms[room_id] = set()
                manager.rooms[room_id].add(user_id)

            elif data['action'] == 'message':
                await manager.broadcast_room(data['room_id'], {
                    'type': 'message',
                    'user_id': user_id,
                    'content': data['content']
                })

    except WebSocketDisconnect:
        manager.disconnect(user_id)
```

## Redis Pub/Sub for Scaling

```python
# Modern redis client with asyncio support (replaces deprecated aioredis)
import redis.asyncio as redis
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

class RedisPubSubManager:
    """Redis Pub/Sub manager using modern redis.asyncio patterns."""

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis = None
        self._listener_tasks = []

    async def connect(self):
        """Connect to Redis with comprehensive error handling."""
        try:
            # redis.asyncio.from_url() returns an async Redis client
            self.redis = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection with ping
            await self.redis.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise RuntimeError(f"Failed to connect to Redis at {self.redis_url}: {e}") from e
        except redis.TimeoutError as e:
            logger.error(f"Redis connection timeout: {e}")
            raise RuntimeError(f"Redis connection timeout at {self.redis_url}: {e}") from e
        except Exception as e:
            logger.error(f"Unexpected error connecting to Redis: {e}")
            raise RuntimeError(f"Unexpected error connecting to Redis: {e}") from e

    async def disconnect(self):
        """Cleanup Redis connections and listener tasks."""
        # Cancel all listener tasks
        for task in self._listener_tasks:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        # Close Redis connection
        if self.redis:
            await self.redis.close()
            logger.info("Disconnected from Redis")

    async def subscribe(self, channel: str, callback):
        """
        Subscribe to a Redis channel using modern async context manager pattern.
        Uses get_message() instead of legacy listen() generator.
        """
        if not self.redis:
            raise RuntimeError("Not connected to Redis. Call connect() first.")

        # Create listener task
        task = asyncio.create_task(self._listener(channel, callback))
        self._listener_tasks.append(task)
        logger.info(f"Subscribed to Redis channel: {channel}")

    async def publish(self, channel: str, message: dict):
        """Publish message to Redis channel with error handling."""
        if not self.redis:
            raise RuntimeError("Not connected to Redis. Call connect() first.")

        try:
            await self.redis.publish(channel, json.dumps(message))
        except redis.RedisError as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            raise

    async def _listener(self, channel: str, callback):
        """
        Modern Redis listener using async context manager and get_message().
        Follows redis.asyncio best practices for resource management.
        """
        try:
            # Use async context manager for automatic cleanup
            async with self.redis.pubsub() as pubsub:
                await pubsub.subscribe(channel)

                # Modern pattern: poll with get_message() instead of listen()
                while True:
                    try:
                        # get_message() with timeout to allow graceful shutdown
                        message = await pubsub.get_message(
                            ignore_subscribe_messages=True,
                            timeout=1.0  # 1 second timeout for responsiveness
                        )

                        if message and message['type'] == 'message':
                            # With decode_responses=True, data is already a string
                            data = json.loads(message['data'])
                            await callback(data)

                    except json.JSONDecodeError as e:
                        logger.error(f"Invalid JSON in message: {e}")
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                        # Continue processing other messages

        except asyncio.CancelledError:
            logger.info(f"Listener for {channel} cancelled")
            raise
        except redis.RedisError as e:
            logger.error(f"Redis error in listener for {channel}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in listener for {channel}: {e}")
            raise

# Usage with WebSocket manager
redis_manager = RedisPubSubManager('redis://localhost:6379')

async def on_redis_message(data):
    """Callback for handling Redis messages."""
    room_id = data['room_id']
    await manager.broadcast_room(room_id, data)

# In startup
try:
    await redis_manager.connect()
    await redis_manager.subscribe('chat_messages', on_redis_message)
except RuntimeError as e:
    logger.error(f"Failed to initialize Redis: {e}")
    # Handle startup failure appropriately

# In shutdown
await redis_manager.disconnect()
```

## Heartbeat Implementation

```python
import asyncio
import logging

logger = logging.getLogger(__name__)

async def heartbeat(websocket: WebSocket, user_id: str, interval: int = 30):
    """Send periodic pings to keep connection alive"""
    try:
        while True:
            await asyncio.sleep(interval)
            await websocket.send_json({'type': 'ping'})
    except asyncio.CancelledError:
        # Normal shutdown - task was cancelled
        logger.debug(f"Heartbeat cancelled for user {user_id}")
        raise
    except Exception as e:
        # Unexpected error - log and allow cleanup
        logger.error(f"Heartbeat failed for user {user_id}: {e}")
        raise

def on_heartbeat_done(task: asyncio.Task, websocket: WebSocket, user_id: str):
    """Monitor heartbeat task completion and handle failures"""
    try:
        task.result()  # Will raise if task failed
    except asyncio.CancelledError:
        # Normal cancellation - no action needed
        pass
    except Exception as e:
        # Heartbeat failed unexpectedly - close connection
        logger.error(f"Heartbeat task failed for user {user_id}: {e}")
        asyncio.create_task(websocket.close(code=1011, reason="Heartbeat failed"))

# Start heartbeat task on connect
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)

    # Create heartbeat task with failure monitoring
    heartbeat_task = asyncio.create_task(heartbeat(websocket, user_id))
    heartbeat_task.add_done_callback(
        lambda t: on_heartbeat_done(t, websocket, user_id)
    )

    try:
        while True:
            data = await websocket.receive_json()
            if data.get('type') == 'pong':
                continue  # Heartbeat response
            # Handle other messages...
    finally:
        # Cancel heartbeat and cleanup
        heartbeat_task.cancel()
        try:
            await heartbeat_task  # Wait for cancellation to complete
        except asyncio.CancelledError:
            pass
        manager.disconnect(user_id)
```
