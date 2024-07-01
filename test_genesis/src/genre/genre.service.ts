import { UpdateGenreInput } from './dto/update-genre.input.dto';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreInput } from './dto/create-genre.input.dto';
import { Genre } from './entities/genre.entity';
import { GenreRepository } from './genre.repository';

@Injectable()
export class GenreService {
  constructor(
    private readonly genreRepository: GenreRepository,
  ) {}

  async findAll() {
    try {
      return await this.genreRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get genres from DB',
        error.message,
      );
    }
  }

  async findGenreById(id: number): Promise<Genre> {
    try {
      const genre = await this.genreRepository.findGenreById(id);
      if (!genre) {
        throw new NotFoundException(`Genre #${id} does not exist`);
      }
      return genre;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get genre from DB',
        error.message,
      );
    }
  }

  public async findGenresByIds(ids) {
    try {
      const foundGenres: Genre[] =
        await this.genreRepository.findGenresByIds(ids);
      return foundGenres;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get genres from DB',
        error.message,
      );
    }
  }

  async create(createGenreInput: CreateGenreInput) {
    try {
      const genre: Promise<Genre> =
        this.genreRepository.createAndSaveGenre(createGenreInput);
      return genre;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create genre',
        error.message,
      );
    }
  }

  async updateGenre(updateGenreInput: UpdateGenreInput): Promise<Genre> {
    try {
      const { id, ...updateGenreInputData } = updateGenreInput;
      const genreToUpdate = await this.genreRepository.updateGenre(
        id,
        updateGenreInputData,
      );

      if (!genreToUpdate) {
        throw new NotFoundException(`Genre #${id} not found`);
      }

      return genreToUpdate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update genre',
        error.message,
      );
    }
  }

  async remove(id: number) {
    try {
      const genre = await this.findGenreById(id);
      await this.genreRepository.removeGenre(genre);
      return genre;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove genre',
        error.message,
      );
    }
  }
}
