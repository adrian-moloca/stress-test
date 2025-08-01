import { Body, Controller, HttpException, Post, UseFilters, UseInterceptors } from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { AllExceptionsFilter, MPInterceptor } from '@smambu/lib.commons-be'
import { parseErrorMessage, tImportedEventsPayload } from '@smambu/lib.constantsjs'
import { ImportedEventsService } from 'src/services/imported-events.service'

@Controller()
export class ImportedEventsController {
  constructor (private readonly importedEventsService: ImportedEventsService) { }

  @Post('/local-events/add')
  @UseFilters(AllExceptionsFilter)
  async addLocalEvents (
    @Body() body: tImportedEventsPayload,
  ): Promise<string> {
    try {
      const {
        source,
        sourceDocId,
        previousValues,
        currentValues,
        tenantId,
        metadata
      } = body

      const event = await this.importedEventsService.publishEvent(
        source,
        sourceDocId,
        previousValues,
        currentValues,
        tenantId,
        metadata
      )

      return event ? 'OK' : 'KO'
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'localEvents', cmd: 'publish' })
  async mpPublishEvents (data : tImportedEventsPayload) {
    try {
      const {
        source,
        sourceDocId,
        previousValues,
        currentValues,
        tenantId,
        metadata
      } = data

      const event = await this.importedEventsService.publishEvent(
        source,
        sourceDocId,
        previousValues,
        currentValues,
        tenantId,
        metadata
      )

      return event
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
