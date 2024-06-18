import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './enitites/user.entity';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module'; // Remove AuthService from imports
import { SqsModule } from '../sqs/sqs.module';
import { LoggerModule } from '../logger/logger.module';
import { UserDetails } from './enitites/user-details.entity';
import { BookModule } from '../book/book.module';
import { GenreModule } from '../genre/genre.module';
import { UserCacheModule } from '../cache/user/user-cache.module';
import { UserActivitiesModule } from '../user-activities/user-activities.module';

@Module({
  imports: [
    UserCacheModule,
    TypeOrmModule.forFeature([User, UserDetails]),
    forwardRef(() => AuthModule),
    forwardRef(() => BookModule),
    forwardRef(() => GenreModule),
    forwardRef(() => UserActivitiesModule),
    SqsModule,
    LoggerModule,
  ],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}
