import { Module } from '@nestjs/common'
import { RedisClientService } from '../services'

@Module({
  imports: [],
  controllers: [],
  providers: [RedisClientService],
  exports: [RedisClientService],
})

export class RedisModule { }
