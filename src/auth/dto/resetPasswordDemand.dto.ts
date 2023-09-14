import { IsEmail, IsNotEmpty } from "class-validator";

export class ResetPasswordDemandDto {
    @IsEmail()
    @IsNotEmpty()
    readonly email : string;
    @IsNotEmpty()
    readonly password : string;
}