import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryPagingBookDto } from './query-paging-book.dto';

describe('QueryPagingBookDto', () => {
  it('should validate page and limit as integers with default values', async () => {
    const dto = plainToInstance(QueryPagingBookDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should validate provided page and limit values', async () => {
    const dto = plainToInstance(QueryPagingBookDto, {
      page: 2,
      limit: 5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(5);
  });

  it('should return an error if page and limit are not integers', async () => {
    const dto = plainToInstance(QueryPagingBookDto, {
      page: 'invalid',
      limit: 'invalid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate optional filters', async () => {
    const dto = plainToInstance(QueryPagingBookDto, {
      filters: {
        title: 'Test Book',
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.filters?.title).toBe('Test Book');
  });

  it('should return an error if filter title is not a string', async () => {
    const dto = plainToInstance(QueryPagingBookDto, {
      filters: {
        title: 123,
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
