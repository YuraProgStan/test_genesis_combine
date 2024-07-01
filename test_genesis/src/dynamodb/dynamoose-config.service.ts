import {
  DynamooseOptionsFactory,
  DynamooseModuleOptions,
} from 'nestjs-dynamoose';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamooseConfigService implements DynamooseOptionsFactory {
  constructor(private configService: ConfigService) {}

  createDynamooseOptions(): DynamooseModuleOptions {
    return {
      aws: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        region: this.configService.get<string>('AWS_REGION'),
      },
      local: true,
      ddb: new DynamoDB({
        endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT'), // specify the local endpoint for DynamoDB Local
      }),
      // table?: TableOptionsOptional;
      // logger?: boolean | LoggerService;
    };
  }
}
