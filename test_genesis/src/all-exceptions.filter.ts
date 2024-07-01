import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error('Unhandled exception', exception);

    const gqlHost = GqlArgumentsHost.create(host);

    if (host.getType<GqlContextType>() === 'graphql') {
      const gqlContext = gqlHost.getContext();

      this.logger.error(
        'GraphQL Context:',
        JSON.stringify(gqlContext, null, 2),
      );

      if (exception instanceof ApolloError) {
        this.logger.error('ApolloError:', exception);
        return exception;
      }

      if (exception instanceof HttpException) {
        const response = exception.getResponse();
        const status = exception.getStatus();
        this.logger.error('HTTP Exception Response:', response);
        return new ApolloError(response as string, status.toString());
      }

      this.logger.error('Unknown exception:', exception);
      return new ApolloError('Internal server error', '500');
    }

    // For HTTP requests
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    this.logger.error('HTTP Request:', {
      method: request.method,
      url: request.url,
      body: request.body,
    });

    this.logger.error('Response status:', status);
    this.logger.error('Exception:', exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
