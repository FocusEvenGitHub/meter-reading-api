import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Reading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'WATER' | 'GAS';

  @Column('float')
  reading: number;

  @Column('text')
  imageUrl: string;

  @Column()
  customerCode: string;

  @CreateDateColumn()
  measureDatetime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
