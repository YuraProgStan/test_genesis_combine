import { Injectable } from '@nestjs/common';
import { createLogger, transports } from 'winston'; // use named imports

@Injectable()
export class LoggerService {
  private logger: ReturnType<typeof createLogger>;

  constructor() {
    this.logger = createLogger({
      transports: [
        new transports.Console(), // use named import
        new transports.File({ filename: 'error.log', level: 'error' }),
      ],
    });
  }

  info(message: string) {
    this.logger.info(message);
  }

  error(message: string) {
    this.logger.error(message);
  }
}
