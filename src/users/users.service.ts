import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { User } from './entities/user.entity.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    try {
      await this.usersRepository.updatePassword(id, hashedPassword);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`User ${id} tidak ditemukan`);
      }

      throw error;
    }
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const existing = await this.usersRepository.findExisting(
      data.username,
      data.email,
    );

    if (existing) {
      const field = existing.username === data.username ? 'username' : 'email';

      throw new ConflictException(`${field} sudah terdaftar`);
    }

    const user = await this.usersRepository.create(data);

    return this.toEntity(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);

    return user ? this.toEntity(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.usersRepository.findByUsername(username);

    return user ? this.toEntity(user) : null;
  }

  async findByUsernameWithPassword(username: string) {
    return this.usersRepository.findByUsernameWithPassword(username);
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User ${id} tidak ditemukan`);
    }

    return this.toEntity(user);
  }

  async findAll(query: QueryUsersDto) {
    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              username: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.usersRepository.findMany(where, skip, limit),

      this.usersRepository.count(where),
    ]);

    return {
      items: users.map((user) => this.toEntity(user)),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const data: Prisma.UserUpdateInput = {
      ...updateUserDto,
    };

    if (updateUserDto.username || updateUserDto.email) {
      const or: Prisma.UserWhereInput[] = [];

      if (updateUserDto.username) {
        or.push({
          username: updateUserDto.username,
        });
      }

      if (updateUserDto.email) {
        or.push({
          email: updateUserDto.email,
        });
      }

      const existing = await this.usersRepository.findExistingForUpdate(id, or);

      if (existing) {
        const field =
          existing.username === updateUserDto.username ? 'username' : 'email';

        throw new ConflictException(`${field} sudah terdaftar`);
      }
    }

    try {
      const user = await this.usersRepository.update(id, data);

      return this.toEntity(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`User ${id} tidak ditemukan`);
      }

      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.usersRepository.remove(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`User ${id} tidak ditemukan`);
      }

      throw error;
    }

    return {
      message: `User ${id} dihapus`,
    };
  }

  private toEntity(user: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const entity = new User();

    entity.id = user.id;
    entity.name = user.name;
    entity.username = user.username;
    entity.email = user.email;
    entity.role = user.role;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;

    return entity;
  }
}
