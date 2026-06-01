import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, MediaType, PlaybackState } from '../database/entities/room.entity';
import { User } from '../database/entities/user.entity';
import { Message } from '../database/entities/message.entity';
import { v4 as uuidv4 } from 'uuid';

// In-memory map of roomId -> connected socket session IDs (max 2)
const roomSessions: Map<string, string[]> = new Map();

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
  ) {}

  async createRoom(): Promise<Room> {
    const room = this.roomRepo.create({ isFull: false });
    return this.roomRepo.save(room);
  }

  async getRoom(id: string): Promise<Room> {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async canJoin(roomId: string): Promise<boolean> {
    const sessions = roomSessions.get(roomId) || [];
    return sessions.length < 2;
  }

  addSession(roomId: string, sessionId: string): number {
    const sessions = roomSessions.get(roomId) || [];
    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId);
      roomSessions.set(roomId, sessions);
    }
    return sessions.length;
  }

  removeSession(roomId: string, sessionId: string): number {
    const sessions = (roomSessions.get(roomId) || []).filter(s => s !== sessionId);
    roomSessions.set(roomId, sessions);
    return sessions.length;
  }

  getSessionCount(roomId: string): number {
    return (roomSessions.get(roomId) || []).length;
  }

  async getOrCreateUser(sessionId: string, name: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { sessionId } });
    if (!user) {
      user = this.userRepo.create({ sessionId, name });
      await this.userRepo.save(user);
    }
    return user;
  }

  async updatePlaybackState(
    roomId: string,
    state: PlaybackState,
    time: number,
  ): Promise<void> {
    await this.roomRepo.update(roomId, { playbackState: state, playbackTime: time });
  }

  async updateMedia(
    roomId: string,
    mediaType: MediaType,
    mediaSource: string,
    mediaTitle?: string,
  ): Promise<void> {
    await this.roomRepo.update(roomId, {
      mediaType,
      mediaSource,
      mediaTitle: mediaTitle || '',
      playbackTime: 0,
      playbackState: 'paused',
    });
  }

  async getRoomState(roomId: string) {
    const room = await this.getRoom(roomId);
    const messages = await this.messageRepo.find({
      where: { roomId },
      order: { timestamp: 'ASC' },
    });
    return { room, messages };
  }

  async saveMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: 'text' | 'reaction',
  ): Promise<Message> {
    const message = this.messageRepo.create({
      roomId,
      senderId,
      senderName,
      content,
      type,
    });
    return this.messageRepo.save(message);
  }
}
