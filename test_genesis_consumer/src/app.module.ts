import { Module } from '@nestjs/common';
import {DynamoDBService} from "./dynamodb/dynamodb.service";
import {LoggerService} from "./logger/logger.service";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {UserActivityLogsService} from "./user-activities/user-activities.service";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {UserActivitiesModule} from "./user-activities/user-activities.module";
import {DynamoDBModule} from "./dynamodb/dynamodb.module";
import {SqsModule} from "./sqs/sqs.module";
import {ConsumerModule} from "./consumer/consumer.module";

@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env', // or ['.env.development', '.env.production']
      }),
      UserActivitiesModule,
      DynamoDBModule,
      SqsModule,
      ConsumerModule,
  ],
    providers: [
        {
            provide: DynamoDBService,
            useFactory: (configService: ConfigService) => {
                const client = new DynamoDBClient({
                    region: configService.get('AWS_REGION'),
                    credentials: {
                        accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
                        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
                    },
                    endpoint: configService.get('DYNAMODB_ENDPOINT'),
                });
                return new DynamoDBService(client);
            },
            inject: [ConfigService],
        },
        UserActivityLogsService,
        LoggerService,
        ],
    exports: [DynamoDBService],
})
export class AppModule {}
