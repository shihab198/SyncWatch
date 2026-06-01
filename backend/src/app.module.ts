import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from './room/room.module';
import { ChatModule } from './chat/chat.module';
import { SyncModule } from './sync/sync.module';
import { User } from './database/entities/user.entity';
import { Room } from './database/entities/room.entity';
import { Message } from './database/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Room, Message],
        synchronize: true, // auto-create tables on startup
        ssl: { rejectUnauthorized: false },
        logging: false,
      }),
      inject: [ConfigService],
    }),
    RoomModule,
    ChatModule,
    SyncModule,
  ],
})
export class AppModule {}
