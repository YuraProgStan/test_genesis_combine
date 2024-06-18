import { registerEnumType } from '@nestjs/graphql';

enum UserStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
}
registerEnumType(UserStatus, {
  name: 'UserStatus',
  description: 'User Status Type',
});

export { UserStatus };

/*
 * When a user completes certain actions (e.g., providing an email),
 * their role is changed from 'USER' to 'AUTHOR'.
 * This allows them to access additional functionalities and privileges.
 */
