import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { Room } from '../database/entities/room.entity';
import { User } from '../database/entities/user.entity';
import { Message } from '../database/entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User, Message])],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
