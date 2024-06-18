import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { randomUUID as uuidv4 } from 'crypto';

export class UserActivityLog {
    activityId: string;
    userId: number;
    activityType: string;
    timestamp: Date;

    static newInstanceFromDTO(
        userId: number,
        activityType: string,
        timestamp: string,
    ): UserActivityLog {
        const activityLog = new UserActivityLog();
        activityLog.activityId = uuidv4();
        activityLog.userId = userId;
        activityLog.activityType = activityType;
        activityLog.timestamp = new Date(timestamp);
        return activityLog;
    }

    static newInstanceFromDynamoDBObject(
        data: Record<string, AttributeValue>,
    ): UserActivityLog {
        const activityLog = new UserActivityLog();
        activityLog.activityId = data.activityId.S!;
        activityLog.userId = Number(data.userId.N!);
        activityLog.activityType = data.activityType.S!;
        activityLog.timestamp = new Date(Number(data.timestamp.N));
        return activityLog;
    }
}
