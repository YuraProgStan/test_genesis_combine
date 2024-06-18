import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SqsService {
  private readonly sqsClient: SQSClient;

  constructor(
    @Inject('SQS_QUEUE_URL') private readonly queueUrl: string,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  async sendMessage(
    messageBody: Record<string, any>,
    messageAttributes?: Record<string, any>,
  ): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody), // Convert the object to a string
      MessageAttributes: messageAttributes,
    });

    try {
      await this.sqsClient.send(command);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send message to SQS',
        error.message,
      );
    }
  }
}
