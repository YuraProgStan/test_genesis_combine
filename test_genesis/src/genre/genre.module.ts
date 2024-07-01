import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { GenreService } from './genre.service';
import { GenreResolver } from './genre.resolver';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { BookModule } from '../book/book.module';
import { GenreCacheModule } from '../cache/genre/genre-cache.module';
import {GenreRepository} from "./genre.repository";

@Module({
  imports: [
    GenreCacheModule,
    TypeOrmModule.forFeature([Genre]),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => BookModule),
  ],
  providers: [GenreService, GenreResolver, GenreRepository],
  exports: [GenreService],
})
export class GenreModule {}
