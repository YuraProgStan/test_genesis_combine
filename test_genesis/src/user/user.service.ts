import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { DataSource, UpdateResult } from 'typeorm';
import { UserInputError } from 'apollo-server-express';
import { User } from './entities/user.entity';
import { UserDetails } from './entities/user-details.entity';
import { UpdateUserInput } from './dto/update-user.input';
import { SqsService } from '../sqs/sqs.service';
import { QUEUE_TYPE } from '../constants/constants';
import { LoggerService } from '../logger/logger.service';
import * as bcrypt from 'bcrypt';
import { ChangePasswordInput } from './dto/change-user-password.dto';
import { AuthService } from '../auth/auth.service';
import { BookService } from '../book/book.service';
import { UserRoles } from './enums/user-role.enum';
import { ConfigService } from '@nestjs/config';
import { filterNullValues } from '../utils/filterNullVallues';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { UserRepository } from './user.repository';
import { MessageType } from '../book/types/book.type';
import { UserDetailsRepository } from './user-details.repository';
import { UserStatus } from './enums/user-status.enum';
import {DeleteUserResponse} from "./types/user.type";
import {ActivityType} from "../user-activities/enums/enums";

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly userDetailsRepository: UserDetailsRepository,
    @Inject(forwardRef(() => BookService))
    private readonly bookService: BookService,
    private readonly sqsService: SqsService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  public async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.findAll();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get users from DB',
        error.message,
      );
    }
  }

  public async getUserById(id: number): Promise<User> {
    try {
      const user =
        await this.userRepository.getUserByIdWithRelationsDetails(id);
      this.logger.info('getUserById');
      this.logger.info(JSON.stringify(user));
      if (!user) {
        throw new UserInputError(`User #${id} does not exist`);
      }
      return user;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        this.logger.error('Failed to get user from DB');
        this.logger.error(error.message);
        throw new InternalServerErrorException(
          'Failed to get user from DB',
          error.message,
        );
      }
    }
  }

  public async create(createUserInput: CreateUserInput): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userDetails = await this.createUserDetails(createUserInput);
      const createdDetails = await queryRunner.manager.save(userDetails);

      const user = await this.createUser(createdDetails);
      const createdUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      await this.sendSignUpMessage(createdUser.id);
      this.logger.info(`User created successfully with id: ${createdUser.id}`);

      const { password: _, ...userWithoutPassword } = createdUser.details;
      const userWithDetailsWithoutPassword: UserWithDetailsWithoutPassword = {
        ...createdUser,
        details: userWithoutPassword,
      };

      return createdUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create user: ${error.message}`);

      if (error.code === '23505') {
        throw new ConflictException('Username or email already exists');
      }
      throw new InternalServerErrorException(
        'Failed to set user to DB',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async createUserDetails(
    createUserInput: CreateUserInput,
  ): Promise<UserDetails> {
    const { username, email, password, fullname, age } = createUserInput;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userDetails = new UserDetails();
    userDetails.username = username;
    userDetails.email = email;
    userDetails.password = hashedPassword;
    if (fullname) {
      userDetails.fullname = fullname;
    }
    if (age) {
      userDetails.age = age;
    }

    return userDetails;
  }

  private async createUser(userDetails: UserDetails): Promise<User> {
    const user = new User();
    user.details = userDetails;

    const username = userDetails.username;
    if (username === this.configService.get('ROOT_ADMIN_USERNAME')) {
      user.role = UserRoles.ADMIN;
    }

    return user;
  }

  private generateMessage(userId, activityType): MessageType {
    return {
      type: QUEUE_TYPE.USER_ACTIVITY,
      payload: {
        userId,
        activityType,
        timestamp: new Date().toString(),
      },
    };
  }

  private async sendSignUpMessage(userId: number) {
    const message = this.generateMessage(
      userId,
      ActivityType.USER_SIGNUP,
    );

    await this.sqsService.sendMessage(message);
  }

  private async sendUserUpdateMessage(userId: number) {
    const message = this.generateMessage(
      userId,
      ActivityType.USER_UPDATED,
    );

    await this.sqsService.sendMessage(message);
  }

  private async sendUserRemoveMessage(userId: number) {
    const message = this.generateMessage(
      userId,
      ActivityType.USER_DELETED,
    );

    await this.sqsService.sendMessage(message);
  }

  public async update(id: number, updateUserInput: Partial<UpdateUserInput>) {
    try {

      // Fetch user and user details
      const user: User = await this.getUserById(id);
      const userDetails: UserDetails = user.details;

      // Destructure the input to separate user details data
      const { username, fullname, age, ...userData } = updateUserInput;

      const userDetailsFiltered: Partial<UserDetails> = filterNullValues({
        username,
        fullname,
        age,
      });
      // Perform updates
      if (Object.keys(userDetailsFiltered).length) {
        await this.userDetailsRepository.updateUserDetailsById(
          userDetails.id,
          userDetailsFiltered,
        );
      }
      if (Object.keys(userData).length) {
        await this.userRepository.updateUserById(id, userData);
      }
      // Fetch and return updated user
      const updatedUser =
        await this.userRepository.getUserByIdWithRelationsDetails(id);
      await this.sendUserUpdateMessage(id);
      return updatedUser;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      }

      if (error.code === '23505') {
        throw new ConflictException('Username or email already exists');
      }

      throw new InternalServerErrorException(
        'Failed to update user in DB',
        error.message,
      );
    }
  }

  public async remove(id: number): Promise<DeleteUserResponse> {
    try {
      const user =
        await this.userRepository.getUserByIdWithRelationsDetails(id);
      if (!user || !user.details) {
        throw new UserInputError(`User with ID ${id} does not exist.`);
      }
      const userDetailsId = user.details.id;
      await this.userDetailsRepository.deleteByUserDetailsId(userDetailsId);

      await this.bookService.updateBookStatusByUserIdForOneAuthorWhichSoftDeleted(
        id,
      );
      this.logger.info(
        `Books for removed user with ID ${id} successfully changed their status to archived.`,
      );

      await this.userRepository.updateUserById(id, {
        status: UserStatus.DELETED,
      });

      await this.sendUserRemoveMessage(user.id);

      return { message: `User with ID ${id} has been removed successfully.` };
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to remove user from DB',
          error.message,
        );
      }
    }
  }

  async getUserDetailsByEmail(
    email: string,
  ): Promise<(Partial<User> & Partial<UserDetails>) | null> {
    try {
      const userWithDetails =
        await this.userRepository.getUserDetailsByEmail(email);

      if (!userWithDetails) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return userWithDetails;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new UserInputError('Failed to fetch user details', { error });
      }
    }
  }

  public async changePassword(
    input: ChangePasswordInput,
  ): Promise<{ message: string }> {
    try {
      const { id, oldPassword, newPassword } = input;

      const userWithDetails =
        await this.userRepository.getUserByIdWithDetailsPassword(id);

      if (!userWithDetails) {
        throw new NotFoundException('User details not found');
      }

      const isMatch = await bcrypt.compare(
        oldPassword,
        userWithDetails.details.password,
      );
      if (!isMatch) {
        throw new UnauthorizedException('Old password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updateResult: UpdateResult =
        await this.userDetailsRepository.updatePasswordById(
          userWithDetails.details.id,
          hashedPassword,
        );

      if (updateResult.affected === 1) {
        return {
          message: `password for user id equal ${id} successfully updated`,
        };
      }
      throw new InternalServerErrorException(
        `Password for user id equal ${id} not correctly updated`,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to change password',
          error.message,
        );
      }
    }
  }

  public async findUsersByIds(ids) {
    try {
      const users: User[] = await this.userRepository.findUsersByIds(ids);
      this.logger.info(`Found users successfully with ids: ${ids.join(',')}`);
      return users;
    } catch (error) {
      throw new Error('Internal Server Error');
    }
  }

  public async getUserRoleById(userId: number): Promise<UserRoles> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user.role;
  }

  public isPasswordExpectedInResponseData(info: any): boolean {
    const detailsField = info.fieldNodes[0]?.selectionSet?.selections?.find(
      (field) => field.name.value === 'details',
    );
    return (
      detailsField?.selectionSet?.selections?.some(
        (field) => field.name.value === 'password',
      ) ?? false
    );
  }
}
