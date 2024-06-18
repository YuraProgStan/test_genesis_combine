import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggerService } from './logger/logger.service';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  getHello(): string {
    this.loggerService.info('Hello message logged.');

    return this.appService.getHello();
  }
}
