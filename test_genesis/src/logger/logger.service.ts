import { Injectable } from '@nestjs/common';
import { createLogger, format, transports } from 'winston'; // import format

@Injectable()
export class LoggerService {
  private logger: ReturnType<typeof createLogger>;

  constructor() {
    this.logger = createLogger({
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
      transports: [new transports.File({ filename: 'combined.log' })],
    });
  }

  info(message: string, ...args: any[]) {
    this.logger.info(message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.logger.error(message, ...args);
  }
}
