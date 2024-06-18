import { Inject, Injectable } from '@nestjs/common';
import { UserActivityLogsService } from '../user-activities/user-activities.service';
import { SqsService } from '../sqs/sqs.service';
import { Cache } from 'cache-manager';
import { QUEUE_TYPE } from '../constants/constants';
import { MessageType } from './types/types';
import { UserActivityLog } from '../user-activities/entities/user-activity.entity';

@Injectable()
export class ConsumerService {
  constructor(
    private userActivityLogsService: UserActivityLogsService,
    private sqsService: SqsService,
  ) {}
  async consumeMessagesFromQueue(): Promise<void> {
    const messages: MessageType[] = await this.sqsService.receiveMessages();
    const userActivitiesPayloads: UserActivityLog[] = [];
    if (messages.length) {
      for (const message of messages) {
          if (message.type === QUEUE_TYPE.USER_ACTIVITY) {
              userActivitiesPayloads.push(message.payload as UserActivityLog);
          }
      }
        await this.userActivityLogsService.logActivitiesBulk(
            userActivitiesPayloads,
        );
    }
  }
}
