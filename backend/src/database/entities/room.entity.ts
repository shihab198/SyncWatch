import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Message } from './message.entity';

export type MediaType = 'youtube' | 'drive' | 'local' | null;
export type PlaybackState = 'playing' | 'paused';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'paused' })
  playbackState: PlaybackState;

  @Column({ type: 'float', default: 0 })
  playbackTime: number;

  @Column({ nullable: true })
  mediaType: MediaType;

  @Column({ nullable: true })
  mediaSource: string; // URL or identifier

  @Column({ nullable: true })
  mediaTitle: string;

  @Column({ default: false })
  isFull: boolean; // true when 2 users have joined

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];
}
