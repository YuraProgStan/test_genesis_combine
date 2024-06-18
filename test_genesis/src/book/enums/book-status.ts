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

export { BookStatus };
