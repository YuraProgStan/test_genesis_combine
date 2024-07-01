import { registerEnumType } from '@nestjs/graphql';

enum BookStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

registerEnumType(BookStatus, {
  name: 'BookStatus',
  description: 'Book Status Types',
});

enum CustomBookSortBy {
  TITLE = 'title',
  PUBLICATION_YEAR = 'publicationYear',
  GENRE = 'genre',
  AUTHOR = 'author',
  BOOK_ID = 'bookId',
}

registerEnumType(CustomBookSortBy, {
  name: 'CustomBookSortBy',
  description: 'Allowed SorBy Types',
});

export { BookStatus, CustomBookSortBy };
