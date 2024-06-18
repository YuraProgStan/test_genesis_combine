import { QUEUE_TYPE } from '../../constants/constants';

export type UserActivityPayload = {
  userId: number;
  activityType: string;
};

export type MessageType = {
  type: typeof QUEUE_TYPE.USER_ACTIVITY;
  payload: UserActivityPayload;
};
