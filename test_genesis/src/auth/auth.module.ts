import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { UserActivitiesModule } from '../user-activities/user-activities.module';
import { SqsModule } from '../sqs/sqs.module';
import { GenreModule } from '../genre/genre.module';
import { DefaultCacheModule } from '../cache/default/default-cache.module';
import { SignupValidationPipe } from './pipes/signup-validation.pipe';
@Module({
  imports: [
    DefaultCacheModule,
    forwardRef(() => UserModule),
    forwardRef(() => GenreModule),
    forwardRef(() => UserActivitiesModule),
    PassportModule.register({ defaultStrategy: 'local' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    UserActivitiesModule,
    SqsModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    AuthResolver,
  ],
  exports: [AuthService],
})
export class AuthModule {}
