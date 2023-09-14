import { PrismaService } from './../prisma/prisma.service';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt'
import * as speakeasy from 'speakeasy'
import { MailerService } from 'src/mailer/mailer.service';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDemandDto } from './dto/resetPasswordDemand.dto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmation.dto';
import { DeleteAccountDto } from './dto/DeleteAccount.dto';

@Injectable()
export class AuthService {
    
    constructor(
        private readonly prismaService: PrismaService,
        private readonly mailerService: MailerService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        ) {}

    async signup(SignupDto: SignupDto) {

        const { username, email, password } = SignupDto;

        //Verifier i l'utilisateur est deja inscrit
        const user = await this.prismaService.user.findUnique({where: {email}});
        if (user) throw new ConflictException('User already exists');

        //Hasher le mot de passe
        const hash = await bcrypt.hash(password,10)

        //Enregistrer l'utilisateur dans la base de donnees
        await this.prismaService.user.create({data :{email,username,password:hash}});

        //Envoyer un email de confirmation
        await this.mailerService.sendSignupConfirmation(email);

        //Retourner une reponse de succes
        return {data: "User created successfully"}
    }

    async signin(signinDto: SigninDto){

        const {email, password} = signinDto

        // Verifier si l'utilisateur est deja inscrit
        const user = await this.prismaService.user.findUnique({where:{email}})

        if (!user) throw new NotFoundException('User not found');
        // Comparer le mot de passe
        const match = await bcrypt.compare(password, user.password);
        if(!match) throw new UnauthorizedException('User not authorized');

        // Rtourner un token jwt
        const payload ={
            sub : user.userId,
            email: user.email,
        }
        const token = this.jwtService.sign(payload, {
            expiresIn: '2h',
            secret: this.configService.get('SECRET_KEY')
        })

        return {
            token, user:{
                username: user.username,
                email
            }
        }
    }

    async resetPasswordDemand(resetPasswordDemandDto: ResetPasswordDemandDto) {
        const {email} = resetPasswordDemandDto
        // Verifier si l'utilisateur est deja inscrit
        const user = await this.prismaService.user.findUnique({where:{email}})
        if (!user) throw new NotFoundException('User not found');

        speakeasy.totp({
            secret: this.configService.get('OTP_CODE'),
            digits: 5,
            step : 60 * 15,
            encoding: 'base32'
        })

        const url = "http://localhost:3000/auth/reset-password-confirmation";

        await this.mailerService.sendResetPassword(email, url, speakeasy.generateSecret().base32);

        return {data: "Reset password demand sent successfully"}
    }

    async resetPasswordConfirmation(resetPasswordConfirmationDto: ResetPasswordConfirmationDto) {
        const {email,password, code} = resetPasswordConfirmationDto
        // Verifier si l'utilisateur est deja inscrit
        const user = await this.prismaService.user.findUnique({where:{email}})
        if (!user) throw new NotFoundException('User not found');

        const match = speakeasy.totp.verify({
            secret: this.configService.get('OTP_CODE'),
            encoding: 'base32',
            token: code,
            digits: 5,
            step : 60 * 15,
        })

        if(!match) throw new UnauthorizedException('Invalid/Expired token');

        const hash = await bcrypt.hash(password,10)
        await this.prismaService.user.update({where:{email}, data:{password:hash}})

        return {data: "Password reset successfully"}
        
    }

    async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto) {
        const { password } = deleteAccountDto
        // Verifier si l'utilisateur est deja inscrit
        const user = await this.prismaService.user.findUnique({where:{userId}})
        if (!user) throw new NotFoundException('User not found');

         // Comparer le mot de passe
         const match = await bcrypt.compare(password, user.password);
         if(!match) throw new UnauthorizedException('Password does not match');

         await this.prismaService.user.delete({where:{userId}})

         return {data: "Account deleted successfully"}
 
    }

}
