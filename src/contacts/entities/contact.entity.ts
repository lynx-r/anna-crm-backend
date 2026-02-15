import { User } from '@app/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['name', 'inn', 'phone'], { unique: true })
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @ManyToOne(() => User, (user) => user.contacts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}
