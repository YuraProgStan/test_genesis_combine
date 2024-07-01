import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserActivitiesModule } from './user-activities/user-activities.module';
import { SqsModule } from './sqs/sqs.module';
import {ConsumerModule} from './consumer/consumer.module';

@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env', // or ['.env.development', '.env.production']
      }),
      UserActivitiesModule,
      SqsModule,
      ConsumerModule,
  ],
})
export class AppModule {}
