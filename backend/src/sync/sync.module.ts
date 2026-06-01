import { Module } from '@nestjs/common';
import { SyncGateway } from './sync.gateway';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [RoomModule],
  providers: [SyncGateway],
})
export class SyncModule {}
