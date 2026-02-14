import { Contact } from '@/contacts/entities/contact.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Пароль не будет подтягиваться обычным find()
  password: string;

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];
}
