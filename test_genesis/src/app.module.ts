import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { BookModule } from './book/book.module';
import { UserModule } from './user/user.module';
import { GenreModule } from './genre/genre.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ReviewModule } from './review/review.module';
import { UserActivitiesModule } from './user-activities/user-activities.module';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { SqsModule } from './sqs/sqs.module';
import { LoggerModule } from './logger/logger.module';
import { DefaultCacheModule } from './cache/default/default-cache.module';
import { UserCacheModule } from './cache/user/user-cache.module';
import { BookCacheModule } from './cache/book/book-cache.module';
import { GenreCacheModule } from './cache/genre/genre-cache.module';
import { ReviewCacheModule } from './cache/review/review-cache.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // or ['.env.development', '.env.production']
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        synchronize: true,
        autoLoadEntities: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      buildSchemaOptions: {
        numberScalarMode: 'integer',
      },
      context: ({ req, res }) => ({ req, res }),
    }),
    DefaultCacheModule,
    UserCacheModule,
    BookCacheModule,
    GenreCacheModule,
    ReviewCacheModule,
    AuthModule,
    UserModule,
    BookModule,
    GenreModule,
    ReviewModule,
    UserActivitiesModule,
    DynamoDBModule,
    SqsModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
