import { Module, OnModuleInit } from '@nestjs/common';
import { SqsModule } from '../sqs/sqs.module';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { UserActivitiesModule } from '../user-activities/user-activities.module';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [
    ConfigModule, // Ensure ConfigModule is imported
    SqsModule,
    DynamoDBModule,
    UserActivitiesModule,
  ],
  providers: [ConfigService, LoggerService, ConsumerService],
})
export class ConsumerModule implements OnModuleInit {
  constructor(
    private readonly consumerService: ConsumerService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  async onModuleInit() {
    const startConsumer = this.configService.get('START_CONSUMER') === 'true';
    const messageConsumptionInterval = this.configService.get<number>('MESSAGE_CONSUMPTION_INTERVAL', 600000); // Default to 600000 if not set
    this.loggerService.info(`startConsumer: ${startConsumer}`);
    if (startConsumer) {
      try {
        await this.consumerService.consumeMessagesFromQueue();
        this.loggerService.info('Consumer service started');
        setInterval(
          () => this.consumerService.consumeMessagesFromQueue(),
            messageConsumptionInterval,
        );
      } catch (error) {
        this.loggerService.error('Error starting consumer service');
      }
    }
  }
}
