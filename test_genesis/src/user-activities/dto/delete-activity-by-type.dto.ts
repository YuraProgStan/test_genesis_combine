import { GetActivityByTypeDto } from './get-activity-by-type.dto';
import { InputType } from '@nestjs/graphql';

@InputType()
export class DeleteActivityByTypeDto extends GetActivityByTypeDto {}
