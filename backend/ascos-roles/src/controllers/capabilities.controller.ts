import { IUser, UserDec, parseErrorMessage, tAsyncLocalStorage } from '@smambu/lib.constantsjs'
import {
  Controller,
  Get,
  HttpException,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { AsyncLocalStorage } from 'async_hooks'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor } from '@smambu/lib.commons-be'
import { CapabilitiesService } from 'src/services/capabilities.service'

declare global {
  namespace NodeJS {
    interface Global {
      als: AsyncLocalStorage<tAsyncLocalStorage>;
    }
  }
}

@UseInterceptors(LoggingInterceptor)
@Controller('capabilities')
export class CapabilitiesController {
  constructor (private readonly capabilitiesService: CapabilitiesService) { }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async findOne (@UserDec() user): Promise<any> {
    try {
      return this.capabilitiesService.getCapabilities(user)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'permissions', cmd: 'get' })
  async getPermissions ({ user }: { user: IUser }) {
    try {
      const res = this.capabilitiesService.getCapabilities(user)

      return res
    } catch (e) {
      console.error(e)

      const message = parseErrorMessage(e)
      throw new RpcException(message)
    }
  }
}
