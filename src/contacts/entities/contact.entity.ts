import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  inn: string;

  @Column()
  region: string;

  @Column()
  contact: string;

  @Column()
  phone: string;

  @Column()
  email: string;
}
