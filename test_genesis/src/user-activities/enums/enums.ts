import { registerEnumType } from '@nestjs/graphql';

export enum ActivityType {
  USER_SIGNUP = 'USER_SIGNUP',
  USER_SIGNIN = 'USER_SIGNIN',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  BOOK_CREATED = 'BOOK_CREATED',
  BOOK_UPDATED_WITH_STATUS_PUBLISHED = 'BOOK_UPDATED_WITH_STATUS_PUBLISHED',
  BOOK_DELETED = 'BOOK_STATUS_CHANGED_TO_ARCHIVED',
}

registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'User and Book Activities Types',
});
