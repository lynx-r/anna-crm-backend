import { Contact } from '@app/contacts/entities/contact.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Пароль не будет подтягиваться обычным find()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'text', nullable: true, select: false })
  hashedRefreshToken?: string | null;

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];
}
