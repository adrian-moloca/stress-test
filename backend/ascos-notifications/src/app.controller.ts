import { NotificationType, parseErrorMessage } from '@smambu/lib.constantsjs'
import { Controller, Get, Param, Put, Query, HttpException, Sse, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common'
import { NotificationsService } from './services'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { Observable, Subject } from 'rxjs'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller()
export class AppController {
  constructor (private readonly notificationsService: NotificationsService) { }
  private subjects = new Map<string, Subject<MessageEvent>>()

  @Get('/getUserNotifications/:page')
  @UseFilters(AllExceptionsFilter)
  async getUserNotifications (@Param('page') page: number, @Query('limit') limit: number, @Req() req) {
    try {
      return await this.notificationsService.getUserNotifications({
        userId: req.user.id,
        page,
        limit
      })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Put('/markAsRead')
  @UseFilters(AllExceptionsFilter)
  async markAsRead (@Req() req) {
    try {
      return await this.notificationsService.markAsRead({ userId: req.user.id })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'notifications', cmd: 'create' })
  async createNotifications (props: {
    usersIds: string[]
    type: NotificationType
    title: string
    body: string
    url?: string | null
  }) {
    try {
      return await this.notificationsService.createNotifications(props)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Sse('watchUserNotifications')
  async sse (@Req() req, @Res() res): Promise<Observable<MessageEvent>> {
    const userId = req.user.id
    if (!this.subjects.has(userId)) {
      const subject = new Subject<MessageEvent>()
      this.subjects.set(userId, subject)

      const notificationCB = (type: NotificationType) => {
        subject.next({ data: { type, userId } } as MessageEvent)
      }
      const redisClient = await this.notificationsService
        .watchUserNotifications(userId, notificationCB)
      const interval = setInterval(() => {
        subject.next({ data: { message: ':' } } as MessageEvent)
      }, 15000)

      res.on('close', () => {
        subject.complete()
        this.subjects.delete(userId)
        clearInterval(interval)
        redisClient.quit()
      })

      return subject.asObservable()
    } else {
      return this.subjects.get(userId).asObservable()
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'notifications', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.notificationsService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'notifications', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.notificationsService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
