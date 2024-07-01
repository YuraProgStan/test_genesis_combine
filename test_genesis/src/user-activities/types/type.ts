// eslint-disable-next-line max-classes-per-file
import { Field, ID, ObjectType } from '@nestjs/graphql';



@ObjectType()
export class DeleteActivitiesResponse {
  @Field()
  message: string;
}

@ObjectType({ description: 'User activity log type.' })
export class UserActivityLogTransform {
  @Field(() => ID)
  activityId: string;

  @Field(() => Number)
  userId: number;

  @Field(() => String)
  activityType: string;

  @Field(() => Date)
  timestamp: Date;
}
