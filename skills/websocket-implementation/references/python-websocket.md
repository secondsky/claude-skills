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
import aioredis
import asyncio

class RedisPubSubManager:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.pubsub = None
        self.redis = None

    async def connect(self):
        self.redis = await aioredis.from_url(self.redis_url)
        self.pubsub = self.redis.pubsub()

    async def subscribe(self, channel: str, callback):
        await self.pubsub.subscribe(channel)
        asyncio.create_task(self._listener(callback))

    async def publish(self, channel: str, message: dict):
        await self.redis.publish(channel, json.dumps(message))

    async def _listener(self, callback):
        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                await callback(data)

# Usage with WebSocket manager
redis_manager = RedisPubSubManager('redis://localhost:6379')

async def on_redis_message(data):
    room_id = data['room_id']
    await manager.broadcast_room(room_id, data)

# In startup
await redis_manager.connect()
await redis_manager.subscribe('chat_messages', on_redis_message)
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
