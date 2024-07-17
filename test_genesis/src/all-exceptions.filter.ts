import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';
import { LoggerService } from './logger/logger.service';
import { stringify } from 'flatted';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    this.loggerService.error('Unhandled exception', exception);

    const gqlHost = GqlArgumentsHost.create(host);

    if (host.getType<GqlContextType>() === 'graphql') {
      const gqlContext = gqlHost.getContext();

      this.loggerService.error(
        'GraphQL Context:',
        stringify(gqlContext, null, 2),
      );

      let formattedError;
      if (exception instanceof ApolloError) {
        this.loggerService.error('ApolloError:', exception);
        formattedError = exception;
      } else if (exception instanceof HttpException) {
        const response = exception.getResponse();
        const status = exception.getStatus();
        this.loggerService.error('HTTP Exception Response:', response);

        const message =
          typeof response === 'string' ? response : JSON.stringify(response);
        formattedError = new ApolloError(message, status.toString());
      } else {
        this.loggerService.error('Unknown exception:', exception);
        formattedError = new ApolloError('Internal server error', '500');
      }

      // Ensure the error message is a string
      if (typeof formattedError.message === 'object') {
        formattedError.message = JSON.stringify(formattedError.message);
      }

      return formattedError;
    }

    // For HTTP requests
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    this.loggerService.error('HTTP Request:', {
      method: request.method,
      url: request.url,
      body: request.body,
    });

    this.loggerService.error('Response status:', status);
    this.loggerService.error('Exception:', exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
