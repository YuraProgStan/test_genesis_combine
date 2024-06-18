import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRoles } from '../user/enums/user-role.enum';
import { UserService } from '../user/user.service';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private usersService: UserService) {}

  async canActivate(context: ExecutionContext) {
    // const request = context.switchToHttp().getRequest();
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    if (request?.user) {
      const { id } = request.user;
      const user = await this.usersService.getUserById(id);
      return user.role === UserRoles.ADMIN;
    }

    return false;
  }
}
