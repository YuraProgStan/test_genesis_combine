import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserWithDetailsWithoutPassword } from './types/auth.type';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }
  async validate(
    email: string,
    password: string,
  ): Promise<UserWithDetailsWithoutPassword> {
    const user: UserWithDetailsWithoutPassword =
      await this.authService.validateUserCreds(email, password);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
