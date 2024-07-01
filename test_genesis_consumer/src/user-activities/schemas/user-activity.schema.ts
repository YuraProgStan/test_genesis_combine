// eslint-disable-next-line max-classes-per-file
import * as dynamoose from 'dynamoose';
import {randomUUID as uuidv4} from "crypto";

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
  activityId: string;
  userId: number;
  activityType: string;
  timestamp: number;

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

export class UserActivityLogKey {
  activityId: string;
}

export { UserActivityLogSchema };
