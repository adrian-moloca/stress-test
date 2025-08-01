import { AllExceptionsFilter, LoggingInterceptor } from '@smambu/lib.commons-be'
import {
  editOrSchedulingDto,
  parseErrorMessage
} from '@smambu/lib.constantsjs'
import { Body, Controller, Get, HttpException, Param, Post, UseFilters, UseInterceptors } from '@nestjs/common'
import { OrSchedulingService } from 'src/services'

@UseInterceptors(LoggingInterceptor)
@Controller('or-scheduling')
export class OrSchedulingController {
  constructor (private readonly orSchedulingService: OrSchedulingService) { }

  @Get(':timeStamp')
  @UseFilters(AllExceptionsFilter)
  async getOperatingRoomById (@Param('timeStamp') timeStamp: number) {
    try {
      return this.orSchedulingService.findByDate(timeStamp)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async editOperatingRoomScheduling (
    @Body() data: editOrSchedulingDto,
  ) {
    try {
      return this.orSchedulingService.editOrScheduling(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
