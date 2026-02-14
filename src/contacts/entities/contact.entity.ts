import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['name', 'inn', 'phone'], { unique: true })
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  inn: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  email: string;
}
