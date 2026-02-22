import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SiteSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ default: 'text' })
  type: string;
}
