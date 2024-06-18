import { UpdateGenreInput } from './dto/update-genre.input.dto';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreInput } from './dto/create-genre.input.dto';
import { In, Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
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

  async findOne(id: number): Promise<Genre> {
    try {
      const genre = await this.genreRepository.findOne({ where: { id } });
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

  async findGenresByIds(ids) {
    try {
      const foundGenres: Genre[] = await this.genreRepository.findBy({
        id: In(ids),
      });
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
      const genre = this.genreRepository.create(createGenreInput);
      return await this.genreRepository.save(genre);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create genre',
        error.message,
      );
    }
  }

  async update(id: number, updateGenreInput: UpdateGenreInput) {
    try {
      const genre = await this.genreRepository.preload({
        id,
        ...updateGenreInput,
      });
      if (!genre) {
        throw new NotFoundException(`Genre #${id} does not exist`);
      }
      return await this.genreRepository.save(genre);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update genre',
        error.message,
      );
    }
  }

  async remove(id: number) {
    try {
      const genre = await this.findOne(id);
      return await this.genreRepository.remove(genre);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove genre',
        error.message,
      );
    }
  }
}
