import {Injectable} from "@nestjs/common";
import {InjectModel, Model} from "nestjs-dynamoose";
import {UserActivityLog, UserActivityLogKey} from "./schemas/user-activity.schema";

@Injectable()
export class UserActivitiesRepository {
    constructor(
        @InjectModel('UserActivity')
        private userActivityLogModel: Model<UserActivityLog, UserActivityLogKey>,
    ) {}

    async logActivitiesBulk(activities: UserActivityLog[]){
        await this.userActivityLogModel.batchPut(activities)
    }
}
