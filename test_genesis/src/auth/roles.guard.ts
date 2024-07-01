import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());
    const { req } = ctx.getContext();

    if (req?.user) {
      const { role } = req.user;
      return roles.includes(role);
    }
    return false;
  }
}
