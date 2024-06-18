import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserActivityLogsService } from './user-activities.service';
import { UserActivityLog } from './entities/user-activity.entity';
import { ApolloError } from 'apollo-server-express';
import { DeleteActivitiesResponse } from './types/type';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => UserActivityLog)
export class UserActivityLogsResolver {
  constructor(
    private readonly userActivityLogsService: UserActivityLogsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserActivityLog])
  async getActivityLogs(
    @Args('userId') userId: number,
  ): Promise<UserActivityLog[]> {
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
  @Query(() => [UserActivityLog])
  async getActivityByType(
    @Args('timestamp') timestamp: Date,
    @Args('activityType') activityType: string,
  ): Promise<UserActivityLog[]> {
    try {
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

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Mutation(() => DeleteActivitiesResponse, { name: 'removeActivitiesByTimestampAndType' })
  async deleteUserActivityByTimestampAndActivityType(
    @Args('timestamp') timestamp: Date,
    @Args('activityType') activityType: string,
  ): Promise<DeleteActivitiesResponse> {
    try {
        console.log("deleteUserActivityByTimestampAndActivityType")
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
