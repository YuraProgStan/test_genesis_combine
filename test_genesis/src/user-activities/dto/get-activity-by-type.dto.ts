import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum } from 'class-validator';
import { ActivityType } from '../enums/enums';

@InputType()
export class GetActivityByTypeDto {
  @Field(() => Date)
  @IsDate()
  timestamp: Date;

  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  activityType: ActivityType;
}
