import { PrismaService } from './../prisma/prisma.service';
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

type Payload = {
    sub : string,
    email : string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(
        configService:ConfigService,
        private readonly prismaService:PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('SECRET_KEY'),
            ignoreExpiration: false,
        })
    }

    async validate(payload: Payload) {
        const user = await this.prismaService.user.findUnique({where:{email:payload.email}})
        if(!user) throw new UnauthorizedException('User not authorized');
        Reflect.deleteProperty(user, 'password');
        return user;
    }
        

}