// import { ActivityType } from '../user-activities/enums/enums';

// export type UserActivityType = {
//   USER: {
//     USER_SIGNUP: string;
//     USER_SIGNIN: string;
//     USER_UPDATED: string;
//     USER_DELETED: string;
//   };
//   BOOK: {
//     BOOK_CREATED: string;
//     BOOK_UPDATED_WITH_STATUS_PUBLISHED: string;
//     BOOK_DELETED: string;
//   };
// };

export type QueueType = {
  USER_ACTIVITY: string;
};

export type ScanReviewsType = {
  TOTALSEGMENTS: number;
  SEGMENT: number;
};

// export const USER_ACTIVITY_TYPE: UserActivityType = {
//   USER: {
//     USER_SIGNUP: ActivityType.USER_SIGNUP,
//     USER_SIGNIN: ActivityType.USER_SIGNIN,
//     USER_UPDATED: ActivityType.USER_UPDATED,
//     USER_DELETED: ActivityType.USER_DELETED,
//   },
//   BOOK: {
//     BOOK_CREATED: ActivityType.BOOK_CREATED,
//     BOOK_UPDATED_WITH_STATUS_PUBLISHED: ActivityType.BOOK_UPDATED_WITH_STATUS_PUBLISHED,
//     BOOK_DELETED: ActivityType.BOOK_DELETED,
//   },
// };

export const QUEUE_TYPE: QueueType = {
  USER_ACTIVITY: 'useractivity',
};

export const SCAN_REVIEWS_TYPE: ScanReviewsType = {
  TOTALSEGMENTS: 4,
  SEGMENT: 0,
};
