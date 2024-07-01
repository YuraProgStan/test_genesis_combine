import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { CreateGenreInput } from './dto/create-genre.input.dto';
import { UpdateGenreInput } from './dto/update-genre.input.dto';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class GenreRepository extends Repository<Genre> {
  constructor(@InjectRepository(Genre) private dataSource: DataSource) {
    super(Genre, dataSource.manager);
  }

  async findGenresByIds(ids) {
    const genres: Genre[] = await this.findBy({
      id: In(ids),
    });
    return genres;
  }

  async findGenreById(id: number): Promise<Genre> {
    const genre = await this.findOne({ where: { id } });
    return genre;
  }

  async createAndSaveGenre(createGenreInput: CreateGenreInput): Promise<Genre> {
    const genre: Genre = this.create(createGenreInput);
    return this.save(genre);
  }

  async updateGenre(
    id: number,
    updateGenreInputData: Partial<UpdateGenreInput>,
  ): Promise<Genre | null> {
    const genreToUpdate = await this.preload({
      id,
      ...updateGenreInputData,
    });

    return this.save(genreToUpdate);
  }

  async removeGenre(genre: Genre): Promise<void> {
    await this.remove(genre);
  }
}
