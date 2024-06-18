import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';

@Catch()
export class AllExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception);

    if (exception instanceof ApolloError) {
      // Apollo errors are already formatted, pass them through
      return exception;
    } else if (exception instanceof HttpException) {
      // Handle known HTTP exceptions
      const response = exception.getResponse();
      const message =
        typeof response === 'string' ? response : (response as any).message;
      throw new ApolloError(message, exception.getStatus().toString());
    } else {
      // Handle unexpected errors
      throw new ApolloError('An unexpected error occurred');
    }
  }
}
