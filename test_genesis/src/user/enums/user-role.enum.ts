import { registerEnumType } from '@nestjs/graphql';

enum UserRoles {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  USER = 'user',
}
registerEnumType(UserRoles, {
  name: 'UserRoles',
  description: 'User Roles Types',
});

export { UserRoles };

/*
 * When a user completes certain actions (e.g., providing an email),
 * their role is changed from 'USER' to 'AUTHOR'.
 * This allows them to access additional functionalities and privileges.
 */
