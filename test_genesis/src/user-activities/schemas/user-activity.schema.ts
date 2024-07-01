// eslint-disable-next-line max-classes-per-file
import * as dynamoose from 'dynamoose';
import { randomUUID as uuidv4 } from 'crypto';
import { UserActivityLogTransform } from '../types/type';
import { Field, ID, ObjectType } from '@nestjs/graphql';

const UserActivityLogSchema = new dynamoose.Schema(
  {
    activityId: {
      type: String,
      hashKey: true,
    },
    userId: {
      type: Number,
      required: true,
      index: {
        name: 'GSI1',
        type: 'global',
        rangeKey: 'timestamp',
      },
    },
    activityType: {
      type: String,
      required: true,
      index: {
        name: 'GSI2',
        type: 'global',
        rangeKey: 'timestamp',
      },
    },
    timestamp: {
      type: Number,
      rangeKey: true,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
);

export class UserActivityLog {
  @Field(() => ID)
  activityId: string;

  @Field(() => Number)
  userId: number;

  @Field(() => String)
  activityType: string;

  @Field(() => Number)
  timestamp: number;

  static newInstanceFromDynamoDBDormObject(
    data: UserActivityLog,
  ): UserActivityLogTransform {
    const result: UserActivityLogTransform = new UserActivityLogTransform();
    result.activityId = data.activityId;
    result.userId = data.userId;
    result.activityType = data.activityType;
    result.timestamp = new Date(data.timestamp);
    return result;
  }

  static newInstanceFromDTO(
    userId: number,
    activityType: string,
    timestamp: string,
  ): UserActivityLog {
    const activityLog = new UserActivityLog();
    activityLog.activityId = uuidv4();
    activityLog.userId = userId;
    activityLog.activityType = activityType;
    activityLog.timestamp = new Date(timestamp).getTime();
    return activityLog;
  }
}
@ObjectType()
export class UserActivityLogKey {
  @Field(() => ID)
  activityId: string;
}

export { UserActivityLogSchema };
