import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginInputDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  password: string;
}
