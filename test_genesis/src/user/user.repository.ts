import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserStatus } from './enums/user-status.enum';
import { UserDetails } from './entities/user-details.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(@InjectRepository(User) private dataSource: DataSource) {
    super(User, dataSource.manager);
  }

  public async findAll() {
    return this.find({
      where: { status: UserStatus.ACTIVE },
      relations: ['books', 'details'],
    });
  }

  public async getUserByIdWithRelationsDetails(id: number) {
    return this.findOne({
      where: { id },
      relations: ['details'],
    });
  }

  public async findUserById(id: number) {
    return this.findOne({
      where: { id },
    });
  }

  public async updateUserById(id, userData): Promise<void> {
    await this.update(id, userData);
  }

  async getUserDetailsByEmail(
    email: string,
  ): Promise<(Partial<User> & Partial<UserDetails>) | null> {
    const userWithDetails = await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.details', 'details')
      .select(['user.id', 'user.role']) // Select only user.id and user.role
      .addSelect(['details.username', 'details.email', 'details.password'])
      .where('details.email = :email', { email })
      .getOne();
    return userWithDetails || null;
  }

  async getUserByIdWithDetailsPassword(
    id: number,
  ): Promise<User & { details: UserDetails }> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.details', 'details')
      .addSelect('details.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findUsersByIds(ids): Promise<User[]> {
    const users = await this.find({
      where: { id: In(ids) },
      relations: ['details'],
    });
    return users;
  }
}
