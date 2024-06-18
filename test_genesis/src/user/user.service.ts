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
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserInputError } from 'apollo-server-express';
import { User } from './enitites/user.entity';
import { UserDetails } from './enitites/user-details.entity';
import { UpdateUserInput } from './dto/update-user.input';
import { UserStatus } from './enums/user-status.enum';
import { SqsService } from '../sqs/sqs.service';
import { QUEUE_TYPE, USER_ACTIVITY_TYPE } from '../constants/constants';
import { LoggerService } from '../logger/logger.service';
import * as bcrypt from 'bcrypt';
import { ChangePasswordInput } from './dto/change-user-password.dto';
import { AuthService } from '../auth/auth.service';
import { BookService } from '../book/book.service';
import { UserRoles } from './enums/user-role.enum';
import { ConfigService } from '@nestjs/config';
import { filterNullValues } from '../utils/filterNullVallues';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserDetails)
    private readonly userDetailsRepository: Repository<UserDetails>,
    @Inject(forwardRef(() => BookService))
    private readonly bookService: BookService,
    private readonly sqsService: SqsService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  public async findAll() {
    try {
      return await this.userRepository.find({
        where: { status: UserStatus.ACTIVE },
        relations: ['books', 'details'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get users from DB',
        error.message,
      );
    }
  }

  public async getUserById(id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['details'],
      });
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
  isPasswordExpectedInResponseData(info: any): boolean {
    const detailsField = info.fieldNodes[0]?.selectionSet?.selections?.find(
      (field) => field.name.value === 'details',
    );
    return (
      detailsField?.selectionSet?.selections?.some(
        (field) => field.name.value === 'password',
      ) ?? false
    );
  }

  public async create(
    createUserInput: CreateUserInput,
  ): Promise<UserWithDetailsWithoutPassword> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        username,
        email,
        password,
        confirm,
        fullname,
        age,
      }: CreateUserInput = createUserInput;

      if (password !== confirm) {
        throw new ConflictException('Passwords do not match');
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create UserDetails
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

      const createdDetails = await queryRunner.manager.save(userDetails);

      const user = new User();
      user.details = createdDetails;
      if (username === this.configService.get('ROOT_ADMIN_USERNAME'))
        user.role = UserRoles.ADMIN;

      // Save User
      const createdUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      const messageBody = {
        type: QUEUE_TYPE.USER_ACTIVITY,
        payload: {
          userId: createdUser.id,
          activityType: USER_ACTIVITY_TYPE.USER.USER_SIGNUP,
          timestamp: new Date().toString(),
        },
      };
      await this.sqsService.sendMessage(messageBody);
      this.logger.info(`User created successfully with id: ${createdUser.id}`);
      const { password: _, ...userWithoutPassword } = createdUser.details;
      const userWithDetailsWithoutPassword: UserWithDetailsWithoutPassword = {
        ...createdUser,
        details: userWithoutPassword,
      };

      return userWithDetailsWithoutPassword;
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

  public async update(id: number, updateUserInput: UpdateUserInput, currentUser: Partial<User> & Partial<UserDetails>) {
    try {
      if (!Object.keys(updateUserInput).length) {
        throw new UserInputError(
          `No values for change provided for user ${id}`,
        );
      }

      if ('password' in updateUserInput) {
        throw new UserInputError(
          'Updating password is not allowed through this endpoint',
        );
      }

      // Destructure the input to separate user details data
      const { username, fullname, age, ...userData }: UpdateUserInput =
        updateUserInput;

      // Fetch user details
      const userDetails = await this.userDetailsRepository.findOne({
        where: { id },
      });
      if (!userDetails) {
        throw new UserInputError(`User details for user #${id} do not exist`);
      }

      // Filter out null or undefined values for user details
      const userDetailsFiltered: Partial<UserDetails> = filterNullValues({
        username,
        fullname,
        age,
      });

      if (Object.keys(userDetailsFiltered).length) {
        await this.userDetailsRepository.update(
          userDetails.id,
          userDetailsFiltered,
        );
      }

      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new UserInputError(`User #${id} does not exist`);
      }

      if (Object.keys(userData).length) {
        await this.userRepository.update(id, userData);
      }

      const updatedUser = await this.userRepository.findOne({
        where: { id },
        relations: ['details'],
      });

      // Send message to SQS
      const messageBody = {
        type: QUEUE_TYPE.USER_ACTIVITY,
        payload: {
          userId: user.id,
          activityType: USER_ACTIVITY_TYPE.USER.USER_UPDATED,
          timestamp: new Date().toString(),
        },
      };
      await this.sqsService.sendMessage(messageBody);

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

  public async remove(id: number): Promise<{ message: string }> {
    try {
      // Check if user exists
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user || !user.details) {
        throw new UserInputError(`User with ID ${id} does not exist.`);
      }
      const userDetailsId = user.details.id;
      await this.userDetailsRepository.delete(userDetailsId);

      await this.bookService.updateBookStatusByUserIdForOneAuthorWhichSoftDeleted(
        id,
      );
      this.logger.info(
        `Books for removed user with ID ${id} successfully changed their status to archived.`,
      );

      await this.userRepository.update(id, { status: UserStatus.DELETED });

      const messageBody = {
        type: QUEUE_TYPE.USER_ACTIVITY,
        payload: {
          userId: user.id,
          activityType: USER_ACTIVITY_TYPE.USER.USER_DELETED,
          timestamp: new Date().toString(),
        },
      };
      await this.sqsService.sendMessage(messageBody);

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

  public async getUserDetailsByEmail(
    email: string,
  ): Promise<(Partial<User> & Partial<UserDetails>) | null> {
    try {
      const userWithDetails: Partial<User> & Partial<UserDetails> =
        await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.details', 'details')
          .select(['user.id', 'user.role']) // Select only user.id
          .addSelect(['details.username', 'details.email', 'details.password']) // Select only specific fields from details
          .where('details.email = :email', { email })
          .getOne();
      if (!userWithDetails) {
        throw new UserInputError(`User #${email} does not exist`);
      }
      return userWithDetails;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to get user from DB',
          error.message,
        );
      }
    }
  }

  public async changePassword(
    input: ChangePasswordInput,
  ): Promise<{ message: string }> {
    try {
      const { id, oldPassword, newPassword } = input;

      const userWithDetails = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.details', 'details')
        .addSelect('details.password')
        .addSelect('details.id')
        .where('user.id = :id', { id })
        .getOne();

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

      const updateResult = await this.userDetailsRepository.update(
        userWithDetails.details.id,
        {
          password: hashedPassword,
        },
      );

      if (updateResult.affected === 1) {
        return { message: `password for user id equal ${id} successfully updated` };
      } else {
        throw new InternalServerErrorException(
          `Password for user id equal ${id} not correctly updated`,
        );
      }
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
      const users = await this.userRepository.find({
        where: { id: In(ids) },
        relations: ['details'],
      });
      this.logger.info(`Found users successfully with ids: ${ids.join(',')}`);
      return users;
    } catch (error) {
      throw new Error('Internal Server Error');
    }
  }
}
