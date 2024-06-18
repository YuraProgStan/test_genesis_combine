import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { QUEUE_TYPE, USER_ACTIVITY_TYPE } from '../constants/constants';
import { SqsService } from '../sqs/sqs.service';
import { UserDetails } from '../user/enitites/user-details.entity';
import { User } from '../user/enitites/user.entity';
import { UserWithDetailsWithoutPassword } from './types/auth.type';
import { DefaultCacheService } from '../cache/default/default-cache.service';

@Injectable()
export class AuthService {
  private redisKey = 'invalidatedTokens';
  constructor(
    @Inject(forwardRef(() => UserService))
    private usersService: UserService,
    private jwtService: JwtService,
    @Inject('DEFAULT_CACHE_MANAGER')
    private cacheService: DefaultCacheService,
    private readonly sqsService: SqsService,
  ) {}
  public getRedisKey(): string {
    return this.redisKey;
  }
  async validateUserCreds(
    email: string,
    password: string,
  ): Promise<UserWithDetailsWithoutPassword> {
    try {
      const userWithDetails: Partial<User> & Partial<UserDetails> =
        await this.usersService.getUserDetailsByEmail(email);

      if (!userWithDetails || !userWithDetails.details) {
        throw new BadRequestException('User not found');
      }
      const isMatch = await bcrypt.compare(
        password,
        userWithDetails.details.password,
      );

      if (!isMatch) {
        throw new UnauthorizedException('Invalid password');
      }
      const { password: _, ...userWithoutPassword } = userWithDetails.details;
      const userWithDetailsWithoutPassword: UserWithDetailsWithoutPassword = {
        ...userWithDetails,
        details: userWithoutPassword,
        id: userWithDetails.id,
      };
      return userWithDetailsWithoutPassword;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to validate user credentials',
          error.message,
        );
      }
    }
  }

  async generateToken(user: any) {
    const token = {
      access_token: this.jwtService.sign({
        role: user.role,
        sub: user.id,
      }),
    };

    const messageBody = {
      type: QUEUE_TYPE.USER_ACTIVITY,
      payload: {
        userId: user.id,
        activityType: USER_ACTIVITY_TYPE.USER.USER_SIGNIN,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await this.sqsService.sendMessage(messageBody);
    } catch (sqsError) {
      throw new InternalServerErrorException(
        'Failed to send message to SQS',
        sqsError.message,
      );
    }

    return token;
  }

  async invalidateToken(token: string): Promise<void> {
    try {
      const redisKey = this.getRedisKey();
      const invalidatedTokens = (await this.cacheService.get(redisKey)) || [];
      invalidatedTokens.push(token);
      await this.cacheService.set(redisKey, invalidatedTokens);
    } catch (error) {
      throw new Error('Failed to connect to Redis: ' + error.message);
    }
  }

  async isTokenInvalid(token: string): Promise<boolean> {
    try {
      const redisKey = this.getRedisKey();
      const invalidatedTokensKeys = await this.cacheService.get(redisKey);
      if (!invalidatedTokensKeys) {
        return false;
      }
      return invalidatedTokensKeys.includes(token);
    } catch (error) {
      if (error.code === 'CONNECTION_ERROR') {
        throw new Error('Failed to connect to Redis: ' + error.message);
      } else {
        throw new Error('Failed to check token validity: ' + error.message);
      }
    }
  }
}
