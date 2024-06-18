import { OmitType } from '@nestjs/mapped-types';
import { UserDetails } from '../enitites/user-details.entity';

export class UserWithoutPassword extends OmitType(UserDetails, ['password']) {}
