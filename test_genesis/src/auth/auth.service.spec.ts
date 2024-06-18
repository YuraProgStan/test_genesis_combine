import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '../user/enitites/user.entity';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { DefaultCacheModule } from '../cache/default/default-cache.module';
import { SqsModule } from '../sqs/sqs.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SqsService } from '../sqs/sqs.service';
import { QUEUE_TYPE, USER_ACTIVITY_TYPE } from '../constants/constants';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let sqsService: SqsService;
  let mockUserRepository;
  let mockUserService;
  let mockCacheService;

  beforeEach(async () => {
    const mockUserDetails = {
      id: 1,
      role: 'user',
      details: {
        username: 'testUser',
        email: 'test@test.com',
        password: await bcrypt.hash('testPassword', 10), // Hashed test password
      },
    };

    mockUserRepository = {
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUserDetails),
      })),
    };

    mockUserService = {
      getUserDetailsByEmail: jest.fn().mockResolvedValue(mockUserDetails),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: 'DEFAULT_CACHE_MANAGER', useValue: mockCacheService },
      ],
      imports: [
        JwtModule.register({
          secret: 'mockSecret', // Use a mock secret for testing
          signOptions: { expiresIn: '60s' },
        }),
        DefaultCacheModule,
        SqsModule,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    sqsService = module.get<SqsService>(SqsService);
  });

  describe('validateUserCreds', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });

    it('should validate user credentials', async () => {
      const mockCredentials = {
        email: 'test@test.com',
        password: 'testPassword', // Plain text test password
      };

      const user = await authService.validateUserCreds(
        mockCredentials.email,
        mockCredentials.password,
      );

      expect(user).toBeDefined();
      expect(user.id).toEqual(1);
      expect(user.role).toEqual('user');
      expect(user.details.username).toEqual('testUser');
      expect(user.details.email).toEqual('test@test.com');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUserService.getUserDetailsByEmail.mockResolvedValue(null);

      const mockCredentials = {
        email: 'nonexistent@test.com',
        password: 'testPassword', // Plain text test password
      };

      await expect(
        authService.validateUserCreds(
          mockCredentials.email,
          mockCredentials.password,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user details not found', async () => {
      const mockUserWithoutDetails = {
        id: 2,
        role: 'user',
        details: null,
      };

      mockUserService.getUserDetailsByEmail.mockResolvedValue(
        mockUserWithoutDetails,
      );

      const mockCredentials = {
        email: 'nodetails@test.com',
        password: 'testPassword', // Plain text test password
      };

      await expect(
        authService.validateUserCreds(
          mockCredentials.email,
          mockCredentials.password,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if password is not match', async () => {
      const mockCredentials = {
        email: 'test@gmail.com',
        password: 'abcd345',
      };
      const mockUserWithoutDetails = {
        id: 2,
        role: 'user',
        details: {
          email: 'nonexistent@test.com',
          password: 'testPassword', // Plain text test password
        },
      };

      mockUserService.getUserDetailsByEmail.mockResolvedValue(
        mockUserWithoutDetails,
      );

      await expect(
        authService.validateUserCreds(
          mockCredentials.email,
          mockCredentials.password,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
  describe('generateToken', () => {
    it('should handle SQS message send error', async () => {
      const mockUser = {
        id: 1,
        role: 'user',
      };

      const mockToken = 'mockJwtToken';

      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);
      jest
        .spyOn(sqsService, 'sendMessage')
        .mockRejectedValue(new Error('SQS error'));

      await expect(authService.generateToken(mockUser)).rejects.toThrow(
        new InternalServerErrorException(
          'Failed to send message to SQS',
          'SQS error',
        ),
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        role: mockUser.role,
        sub: mockUser.id,
      });
    });

    it('should generate a token and send message to SQS', async () => {
      const mockUser = {
        id: 1,
        role: 'user',
      };

      const mockToken = 'mockJwtToken';

      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);
      jest.spyOn(sqsService, 'sendMessage').mockResolvedValue();

      const result = await authService.generateToken(mockUser);

      expect(result).toEqual({ access_token: mockToken });
      expect(jwtService.sign).toHaveBeenCalledWith({
        role: mockUser.role,
        sub: mockUser.id,
      });
      expect(sqsService.sendMessage).toHaveBeenCalledWith({
        type: QUEUE_TYPE.USER_ACTIVITY,
        payload: {
          userId: mockUser.id,
          activityType: USER_ACTIVITY_TYPE.USER.USER_SIGNIN,
          timestamp: expect.any(String),
        },
      });
    });
  });
  describe('invalidateToken', () => {
    it('should invalidate the token', async () => {
      mockCacheService.get.mockResolvedValue(null);

      mockCacheService.set.mockResolvedValue(undefined);

      const token = 'mockToken';

      await authService.invalidateToken(token);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        authService.getRedisKey(),
      );

      expect(mockCacheService.set).toHaveBeenCalledWith(
        authService.getRedisKey(),
        expect.arrayContaining([token]),
      );
    });

    it('should throw an error if failed to connect to Redis', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Connection failed'));

      const token = 'mockToken';
      const mockRedisKey = 'invalidatedTokens';

      await expect(authService.invalidateToken(token)).rejects.toThrow(
        'Failed to connect to Redis: Connection failed',
      );

      expect(mockCacheService.get).toHaveBeenCalledWith(mockRedisKey);

      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });
  describe('isTokenInvalid', () => {
    it('should check if token is invalid', async () => {
      const token = 'mockToken';

      mockCacheService.get.mockResolvedValue([token]);

      const result = await authService.isTokenInvalid(token);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        authService.getRedisKey(),
      );

      expect(result).toBe(true);
    });

    it('should return false if token is not in invalidated tokens list', async () => {
      const token = 'mockToken';

      mockCacheService.get.mockResolvedValue([]);

      const result = await authService.isTokenInvalid(token);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        authService.getRedisKey(),
      );

      expect(result).toBe(false);
    });

    it('should throw an error if cacheService.get fails', async () => {
      const token = 'mockToken';

      mockCacheService.get.mockRejectedValue(new Error('Connection failed'));

      await expect(authService.invalidateToken(token)).rejects.toThrow(
        'Failed to connect to Redis: Connection failed',
      );
    });
  });
});
