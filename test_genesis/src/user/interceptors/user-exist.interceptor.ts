import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserService } from '../user.service';
import { UserInputError } from 'apollo-server-express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class UserExistsInterceptor implements NestInterceptor {

  constructor(
      private readonly usersService: UserService,
      private readonly logger: LoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;
    if (!user || !user.id) {
      throw new UserInputError('User ID is missing');
    }

    const userFromDb = await this.usersService.getUserById(user.id);
    if (!userFromDb) {
      throw new UserInputError(`User #${user.id} does not exist`);
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.info(`User #${user.id} exists`);
      }),
    );
  }
}
