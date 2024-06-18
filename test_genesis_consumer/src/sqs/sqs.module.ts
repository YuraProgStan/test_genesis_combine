import { Module } from '@nestjs/common';
import { SqsService } from './sqs.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Module({
  imports: [ConfigModule],
  providers: [
    SqsService,
    {
      provide: 'SQS_QUEUE_URL',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('SQS_QUEUE_URL'),
      inject: [ConfigService],
    },
    LoggerService,
  ],
  exports: [SqsService],
})
export class SqsModule {}
