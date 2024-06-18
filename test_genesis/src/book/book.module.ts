import { BookCacheModule } from '../cache/book/book-cache.module';
import { forwardRef, Module } from '@nestjs/common';
import { Book } from './entities/book.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { UserActivitiesModule } from '../user-activities/user-activities.module';
import { AuthModule } from '../auth/auth.module';
import { SqsModule } from '../sqs/sqs.module';
import { GenreModule } from '../genre/genre.module';
import { BookResolver } from './book.resolver';
import { BookService } from './book.service';

@Module({
  imports: [
    BookCacheModule,
    TypeOrmModule.forFeature([Book]),
    forwardRef(() => UserModule),
    UserActivitiesModule,
    AuthModule,
    SqsModule,
    forwardRef(() => GenreModule),
  ],
  providers: [BookResolver, BookService],
  exports: [BookService],
})
export class BookModule {}
