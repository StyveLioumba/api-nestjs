import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmation.dto';
import { ResetPasswordDemandDto } from './dto/resetPasswordDemand.dto';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import {Request} from 'express'
import { DeleteAccountDto } from './dto/DeleteAccount.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService) {}

    @Post('signup')
    signup(@Body() signupDto:SignupDto){
        return this.authService.signup(signupDto);
    }

    @Post('signin')
    signin(@Body() signinDto:SigninDto){
        return this.authService.signin(signinDto);
    }

    @Post('reset-password')
    resetPasswordDemand(@Body() resetPasswordDemandDto:ResetPasswordDemandDto){
        return this.authService.resetPasswordDemand(resetPasswordDemandDto);
    }

    @Post('reset-password-confirmation')
    resetPasswordConfirmation(@Body() resetPasswordConfirmationDto:ResetPasswordConfirmationDto){
        return this.authService.resetPasswordConfirmation(resetPasswordConfirmationDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('delete')
    deleteAccount(@Req() request:Request, @Body() deleteAccountDto: DeleteAccountDto){
        const userId: string = request.user['userId'];
        return this.authService.deleteAccount(userId,deleteAccountDto);
    }



}
