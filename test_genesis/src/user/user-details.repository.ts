import { Injectable } from '@nestjs/common';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { UserDetails } from './entities/user-details.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserDetailsRepository extends Repository<UserDetails> {
  constructor(@InjectRepository(UserDetails) private dataSource: DataSource) {
    super(UserDetails, dataSource.manager);
  }

  async updatePasswordById(
    id: number,
    hashedPassword: string,
  ): Promise<UpdateResult> {
    const updateResult: UpdateResult = await this.update(id, {
      password: hashedPassword,
    });
    return updateResult;
  }

  public async updateUserDetailsById(id, userData): Promise<void> {
    await this.update(id, userData);
  }

  async deleteByUserDetailsId(userDetailsId): Promise<void> {
    await this.delete(userDetailsId);
  }
}
