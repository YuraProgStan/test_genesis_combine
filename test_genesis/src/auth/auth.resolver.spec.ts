import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { AuthResolver } from './auth.resolver';
import {
  MessageResponse,
  UserWithDetailsWithoutPassword,
} from './types/auth.type';
import { UserRoles } from '../user/enums/user-role.enum';
import { JwtService } from '@nestjs/jwt';
import { ApolloError } from 'apollo-server-express';
import { BadRequestException } from '@nestjs/common';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;
  let userServiceMock: UserService;
  let jwtServiceMock: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: { generateToken: jest.fn(), invalidateToken: jest.fn() },
        }, // Mock AuthService
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            isPasswordExpectedInResponseData: jest.fn(),
          },
        }, // Mock UserService
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
    userServiceMock = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('signIn', () => {
    it('should return a token', async () => {
      const user: UserWithDetailsWithoutPassword = {
        id: 1,
        role: UserRoles.USER,
        details: {
          username: 'guest8',
          email: 'test15@gmail.com',
        },
      };
      jest
        .spyOn(authService, 'generateToken')
        .mockImplementation(() => Promise.resolve({ access_token: 'token' }));
      expect(
        (await resolver.logIn('test@example.com', 'password', user))
          .access_token,
      ).toBe('token');
    });
  });

  describe('signUp', () => {
    it('should sign up a user', async () => {
      const createUserInput = {
        username: 'guest8',
        email: 'test15@gmail.com',
        password: 'passwordA123*',
        confirm: 'passwordA123*',
      };
      const user: UserWithDetailsWithoutPassword = {
        id: 1,
        role: UserRoles.USER,
        details: {
          username: 'guest8',
          email: 'test15@gmail.com',
        },
      };

      const info: any = {
        fieldNodes: [
          {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'password', // Mocking the selected field
                  },
                },
              ],
            },
          },
        ],
      };

      jest
        .spyOn(userServiceMock, 'isPasswordExpectedInResponseData')
        .mockReturnValue(false);
      jest.spyOn(userServiceMock, 'create').mockResolvedValue(user); // Mocking the create method to resolve

      // Testing the signUp method
      expect(await resolver.signUp(createUserInput, info)).toBe(user);
    });

    it('should throw an error if password field is expected', async () => {
      const createUserInput = {
        username: 'guest8',
        email: 'test15@gmail.com',
        password: 'passwordA123*',
        confirm: 'passwordA123*',
      };

      const info: any = {
        fieldNodes: [
          {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'password', // Mocking the selected field
                  },
                },
              ],
            },
          },
        ],
      };

      jest
        .spyOn(userServiceMock, 'isPasswordExpectedInResponseData')
        .mockReturnValue(true);

      await expect(resolver.signUp(createUserInput, info)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('signOut', () => {
    it('should sign out successfully with a valid token', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer validToken',
        },
      };

      const expectedResult: MessageResponse = {
        message: 'Sign out has been successfully',
      };

      jest
        .spyOn(authService, 'invalidateToken')
        .mockResolvedValueOnce(undefined);

      const result = await resolver.signOut(mockReq);

      expect(result).toEqual(expectedResult);
    });

    it('should throw an error if no token is provided', async () => {
      const mockReq = {
        headers: {},
      };

      await expect(resolver.signOut(mockReq)).rejects.toThrowError(ApolloError);
    });
  });
});
