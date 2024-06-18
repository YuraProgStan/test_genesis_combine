import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GenreService } from './genre.service';
import { Genre } from './entities/genre.entity';
import { ApolloError } from 'apollo-server-express';
import { Inject, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateGenreInput } from './dto/create-genre.input.dto';
import { UpdateGenreInput } from './dto/update-genre.input.dto';
import { GenreResponse } from './types/types';
import { GenreCacheService } from '../cache/genre/genre-cache.service';

@Resolver()
export class GenreResolver {
  constructor(
    private genreService: GenreService,
    @Inject('GENRE_CACHE_MANAGER')
    private cacheManager: GenreCacheService,
  ) {}

  @Query(() => [Genre], { name: 'genres' })
  async getGenresAll() {
    try {
      return await this.genreService.findAll();
    } catch (error) {
      throw new ApolloError('Failed to get genres', 'INTERNAL_SERVER_ERROR');
    }
  }

  @Query(() => Genre, { name: 'genre', nullable: true })
  async getGenreById(
    @Args('id', { type: () => ID }, ParseIntPipe) id: number,
  ): Promise<Genre> {
    try {
      const cacheKey = `genre:${id}`;
      const cachedGenre = await this.cacheManager.get(cacheKey);
      if (cachedGenre) {
        return cachedGenre;
      }
      const genre: Genre = await this.genreService.findOne(id);
      await this.cacheManager.set(cacheKey, genre);
      return genre;
    } catch (error) {
      throw new ApolloError('Failed to get genre', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'user')
  @Mutation(() => GenreResponse, { name: 'createGenre', nullable: true })
  async create(@Args('createGenreInput') createGenreInput: CreateGenreInput) {
    try {
      return await this.genreService.create(createGenreInput);
    } catch (error) {
      throw new ApolloError('Failed to create genre', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @Mutation(() => Genre, { name: 'updateGenre' })
  async update(
    @Args('id', ParseIntPipe) id: number,
    @Args('updateGenreInput') updateGenreInput: UpdateGenreInput,
  ) {
    try {
      return await this.genreService.update(id, updateGenreInput);
    } catch (error) {
      throw new ApolloError('Failed to update genre', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @Mutation(() => Genre, { name: 'removeGenre' })
  async remove(@Args('id', ParseIntPipe) id: number) {
    try {
      return await this.genreService.remove(id);
    } catch (error) {
      throw new ApolloError('Failed to remove genre', 'INTERNAL_SERVER_ERROR');
    }
  }
}
