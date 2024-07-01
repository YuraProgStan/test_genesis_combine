import { CurrentUserType } from '../user/types/user.type';
import { UserRoles } from '../user/enums/user-role.enum';

export const isCurrentUserType = (obj: any): obj is CurrentUserType => {
  return (
    typeof obj?.id === 'number' &&
    typeof obj?.role === 'string' &&
    Object.values(UserRoles).includes(obj.role) &&
    Object.keys(obj).length === 2
  );
};
