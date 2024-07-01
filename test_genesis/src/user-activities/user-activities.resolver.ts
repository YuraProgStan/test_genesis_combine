import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserActivityLogsService } from './user-activities.service';
import { ApolloError } from 'apollo-server-express';
import {
  DeleteActivitiesResponse,
  UserActivityLogTransform,
} from './types/type';
import { ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserActivityLog } from './schemas/user-activity.schema';
import { CurrentUser } from '../user/decorators/users.decorator';
import { CurrentUserType } from '../user/types/user.type';
import { GetActivityByTypeDto } from './dto/get-activity-by-type.dto';
import { DeleteActivityByTypeDto } from './dto/delete-activity-by-type.dto';

@Resolver(() => UserActivityLog)
export class UserActivityLogsResolver {
  constructor(
    private readonly userActivityLogsService: UserActivityLogsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserActivityLogTransform], { name: 'getActivityLogs' })
  async getActivityLogs(
    @Args('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<UserActivityLogTransform[]> {
    try {
      return await this.userActivityLogsService.getActivityLogs(userId);
    } catch (error) {
      throw new ApolloError(
        'Failed to get activity logs',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserActivityLogTransform])
  async getActivityByType(
    @Args('getActivityByTypeDto') getActivityByTypeDto: GetActivityByTypeDto,
  ): Promise<UserActivityLogTransform[]> {
    try {
      const { activityType, timestamp } = getActivityByTypeDto;
      return await this.userActivityLogsService.getActivityByType(
        activityType,
        timestamp,
      );
    } catch (error) {
      throw new ApolloError(
        'Failed to get activity by type',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => DeleteActivitiesResponse, {
    name: 'removeActivitiesByTimestampAndType',
  })
  async deleteUserActivityByTimestampAndActivityType(
    @Args('deleteActivityByTypeDto')
    deleteActivityByTypeDto: DeleteActivityByTypeDto,
  ): Promise<DeleteActivitiesResponse> {
    try {
      const { activityType, timestamp } = deleteActivityByTypeDto;
      return await this.userActivityLogsService.removeActivitiesByTimestampAndType(
        activityType,
        timestamp,
      );
    } catch (error) {
      throw new ApolloError(
        'Failed to remove activities by timestamp and type',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
}
