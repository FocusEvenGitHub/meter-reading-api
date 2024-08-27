import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Reading {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;  // 'water' ou 'gas'

  @Column('decimal', { precision: 10, scale: 2 })
  reading: number;

  @Column()
  imageUrl: string;

  @Column()
  month: number;

  @Column()
  year: number;
}
