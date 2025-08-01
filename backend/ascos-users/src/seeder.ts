import { seeder } from 'nestjs-seeder'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersSeeder } from './modules/seeds/user.seed'
import { Credential, CredentialSchema } from './schemas/credentials.schema'
seeder({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI_USERS'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Credential.name, schema: CredentialSchema }]),
  ],
}).run([UsersSeeder])
