import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {

    constructor(configSerive: ConfigService) {
        super({
            datasources: {
                db: {
                    url: configSerive.get("DATABASE_URL"),
                },
            },
        });
    }
    
}
