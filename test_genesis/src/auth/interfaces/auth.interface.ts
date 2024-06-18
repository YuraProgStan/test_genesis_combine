import { ExecutionContext } from '@nestjs/common';

export interface IAuthGuard<TUser = any> {
  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): Promise<TUser>;
}
