import { Injectable, Inject } from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { MessageType } from '../consumer/types/types';
import { safeObjectParse } from '../utils/safe-parse';
@Injectable()
export class SqsService {
  private readonly sqsClient: SQSClient;
  private readonly BATCH_SIZE = 25

  constructor(
    @Inject('SQS_QUEUE_URL') private readonly queueUrl: string,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

    async receiveMessages(desiredBatchSize: number = this.BATCH_SIZE): Promise<MessageType[]> {
        console.log('START CONSUME MESSAGES FROM SQS');
        const parsedMessages: MessageType[] = [];
        let remainingMessagesToFetch = desiredBatchSize;

        while (remainingMessagesToFetch > 0) {
            const messagesToFetch = Math.min(remainingMessagesToFetch, 10);

            const command = new ReceiveMessageCommand({
                QueueUrl: this.queueUrl,
                MaxNumberOfMessages: messagesToFetch,
                WaitTimeSeconds: 20,
            });

            try {
                const data = await this.sqsClient.send(command);
                if (data.Messages) {
                    this.logger.info(`Received ${data.Messages.length} messages`);

                    for (const message of data.Messages) {
                        const { type, payload } = safeObjectParse(message.Body);
                        parsedMessages.push({ type, payload });
                        await this.deleteMessage(this.queueUrl, message.ReceiptHandle);
                    }

                    remainingMessagesToFetch -= data.Messages.length;

                    // Break if fewer messages than requested were returned, indicating no more messages are currently available
                    if (data.Messages.length < messagesToFetch) {
                        break;
                    }
                } else {
                    this.logger.info('No messages available');
                    break;
                }
            } catch (error) {
                if (error instanceof Error) {
                    this.logger.error(`Error receiving messages: ${error.message}`);
                } else {
                    this.logger.error(`Unknown error occurred while receiving messages`);
                }
                break;
            }
        }

        return parsedMessages;
    }

  async deleteMessage(queueUrl: string, receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    try {
      await this.sqsClient.send(command);
      this.logger.info('Message deleted');
    } catch (error) {
        if (error instanceof Error) {
            this.logger.error(`Error deleting messages: ${error.message}`);
        } else {
            this.logger.error(`Unknown error occurred while deleting messages`);
        }
    }
  }
}
