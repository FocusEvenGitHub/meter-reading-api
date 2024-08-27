import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Reading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: 'WATER' | 'GAS';

  @Column({ type: 'float' })
  reading: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;

  @Column({ type: 'varchar', length: 50 })
  customerCode: string;

  @Column({ type: 'datetime' })
  measureDateTime: Date;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
