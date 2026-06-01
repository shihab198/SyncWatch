import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';

interface JoinPayload {
  roomId: string;
  name: string;
  sessionId: string;
}

interface PlaybackPayload {
  roomId: string;
  state: 'playing' | 'paused';
  time: number;
  sessionId: string;
}

interface SeekPayload {
  roomId: string;
  time: number;
  sessionId: string;
}

interface MediaPayload {
  roomId: string;
  mediaType: 'youtube' | 'drive' | 'local';
  mediaSource: string;
  mediaTitle?: string;
  sessionId: string;
}

interface ChatPayload {
  roomId: string;
  content: string;
  type: 'text' | 'reaction';
  sessionId: string;
  senderName: string;
}

// socket.id -> { roomId, sessionId, name }
const socketMeta: Map<string, { roomId: string; sessionId: string; name: string }> = new Map();

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  transports: ['websocket', 'polling'],
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  handleConnection(client: Socket) {
    console.log(`Socket connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const meta = socketMeta.get(client.id);
    if (!meta) return;

    const { roomId, name } = meta;
    this.roomService.removeSession(roomId, client.id);
    socketMeta.delete(client.id);

    this.server.to(roomId).emit('user:left', { name });
    this.server.to(roomId).emit('presence:update', {
      count: this.roomService.getSessionCount(roomId),
    });
    console.log(`${name} disconnected from room ${roomId}`);
  }

  @SubscribeMessage('room:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    const { roomId, name, sessionId } = payload;

    // Check room exists
    let room;
    try {
      room = await this.roomService.getRoom(roomId);
    } catch {
      client.emit('error', { message: 'Room not found' });
      return;
    }

    // Check capacity (2 users max)
    const canJoin = await this.roomService.canJoin(roomId);
    if (!canJoin) {
      client.emit('error', { message: 'Room is full' });
      return;
    }

    // Register session
    const count = this.roomService.addSession(roomId, client.id);
    socketMeta.set(client.id, { roomId, sessionId, name });

    // Ensure user exists in DB
    const user = await this.roomService.getOrCreateUser(sessionId, name);

    // Join socket room
    client.join(roomId);

    // Send full room state to the joining user
    const { room: freshRoom, messages } = await this.roomService.getRoomState(roomId);
    client.emit('room:state', {
      room: freshRoom,
      messages,
      isHost: count === 1,
    });

    // Notify others
    client.to(roomId).emit('user:joined', { name });

    // Broadcast presence
    this.server.to(roomId).emit('presence:update', { count });

    console.log(`${name} joined room ${roomId} (${count}/2)`);
  }

  @SubscribeMessage('playback:change')
  async handlePlayback(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlaybackPayload,
  ) {
    const { roomId, state, time } = payload;

    // Persist to DB
    await this.roomService.updatePlaybackState(roomId, state, time);

    // Broadcast to the OTHER user only (last-write-wins, sender already updated themselves)
    client.to(roomId).emit('playback:sync', { state, time, from: socketMeta.get(client.id)?.name });
  }

  @SubscribeMessage('playback:seek')
  async handleSeek(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SeekPayload,
  ) {
    const { roomId, time } = payload;

    await this.roomService.updatePlaybackState(
      roomId,
      'paused', // pause on seek, resume after
      time,
    );

    client.to(roomId).emit('playback:seek', { time });
  }

  @SubscribeMessage('media:set')
  async handleMediaSet(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MediaPayload,
  ) {
    const { roomId, mediaType, mediaSource, mediaTitle } = payload;

    await this.roomService.updateMedia(roomId, mediaType, mediaSource, mediaTitle);

    // Broadcast new media to everyone including sender
    this.server.to(roomId).emit('media:changed', {
      mediaType,
      mediaSource,
      mediaTitle,
      from: socketMeta.get(client.id)?.name,
    });
  }

  @SubscribeMessage('chat:message')
  async handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatPayload,
  ) {
    const { roomId, content, type, sessionId, senderName } = payload;

    const user = await this.roomService.getOrCreateUser(sessionId, senderName);
    const message = await this.roomService.saveMessage(
      roomId,
      user.id,
      senderName,
      content,
      type,
    );

    this.server.to(roomId).emit('chat:message', {
      id: message.id,
      content: message.content,
      type: message.type,
      senderName: message.senderName,
      timestamp: message.timestamp,
    });
  }

  @SubscribeMessage('sync:ping')
  async handleSyncPing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; clientTime: number },
  ) {
    const { roomId, clientTime } = payload;
    const room = await this.roomService.getRoom(roomId);

    client.emit('sync:pong', {
      serverTime: room.playbackTime,
      state: room.playbackState,
      clientTime,
    });
  }
}
