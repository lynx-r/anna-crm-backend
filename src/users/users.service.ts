import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Метод для создания пользователя (вызывается из AuthService.register)
  async create(createUserDto: CreateUserDto): Promise<User> {
    const userExists = await this.usersRepository.existsBy({
      email: createUserDto.email,
    });
    if (userExists) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
    const newUser = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(newUser);
  }

  // Метод для поиска по email с паролем (вызывается из AuthService.validateUser)
  async findOneWithPassword(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'role', 'password'], // Явно просим вернуть пароль
    });
  }

  async findOneWithRefreshTokenById(userId: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'hashedRefreshToken'], // Явно просим вернуть пароль
    });
  }

  // Обычный поиск (для JwtStrategy)
  async findOne(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
  }
}
