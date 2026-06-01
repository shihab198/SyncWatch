import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('create')
  async createRoom() {
    const room = await this.roomService.createRoom();
    return { roomId: room.id };
  }

  @Get(':id/exists')
  async roomExists(@Param('id') id: string) {
    try {
      const room = await this.roomService.getRoom(id);
      const canJoin = await this.roomService.canJoin(id);
      return { exists: true, canJoin };
    } catch {
      return { exists: false, canJoin: false };
    }
  }
}
