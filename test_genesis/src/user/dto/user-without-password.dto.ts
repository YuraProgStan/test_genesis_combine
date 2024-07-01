import { OmitType } from '@nestjs/mapped-types';
import { UserDetails } from '../entities/user-details.entity';

export class UserWithoutPassword extends OmitType(UserDetails, ['password']) {}
