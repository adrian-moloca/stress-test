import { Component, INotification, IUserNotificationsResponse, NotificationStatus, NotificationType, getRedisNotificationKey } from '@smambu/lib.constantsjs'
import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { NotificationData, NotificationDocument } from '../schemas/notifications.schema'
import { LoggingService, RedisClientService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'

@Injectable()
export class NotificationsService {
  private models: Array<{ model: Model<any>; label: string }>
  constructor (
    @InjectModel(NotificationData.name) private notificationsModel: Model<NotificationDocument>,
    @Inject(RedisClientService)
    private readonly redis: RedisClientService,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.NOTIFICATIONS)
    this.models = [
      { model: this.notificationsModel, label: 'notificationdatas' },
    ]
  }

  async watchUserNotifications (userId: string, callback: (type: NotificationType) => void) {
    const client = this.redis.client.duplicate()
    await client.subscribe(getRedisNotificationKey(userId))
    client.on('message', (_channel, message) => {
      try {
        const data = JSON.parse(message)
        if (data.userId === userId)
          callback(data.type)
      } catch (error) {
        console.error(error)
      }
    })
    return client
  }

  async getUserNotifications ({ userId, page, limit }:
  { userId: string, page: number, limit: number }): Promise<IUserNotificationsResponse> {
    const response = this.notificationsModel
      .find({ to: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const unreadCount = await this.notificationsModel
      .countDocuments({ to: userId, status: NotificationStatus.SENT })

    return {
      notifications: await response.exec(),
      unreadCount,
      page,
      limit,
    }
  }

  async markAsRead ({ userId }: { userId: string }) {
    try {
      const timestamp = new Date()
      await this.notificationsModel
        .updateMany({ to: userId, status: NotificationStatus.SENT },
          { status: NotificationStatus.READED, readedAt: timestamp })

      return timestamp
    } catch (error) {
      await this.loggingService.throwErrorAndLog(error)
    }
  }

  async createNotifications ({
    usersIds,
    type,
    title,
    body,
    action,
  }: {
    usersIds: string[]
    type: NotificationType
    title: string
    body: string
    action?: INotification['action']
  }): Promise<NotificationData[]> {
    try {
      const actionDate = action.date != null && { date: new Date(action.date) }

      const notifications = await this.notificationsModel.create(
        usersIds.map(userId => ({
          to: userId,
          type,
          status: NotificationStatus.SENT,
          title,
          body,
          action: action == null
            ? {
              type: null,
            }
            : {
              ...action,
              ...actionDate,
            },
          timestamps: {
            createdAt: new Date(),
          },
        }
        ))
      ) as NotificationData[]

      for (const userId of usersIds)
        this.redis.client.publish(getRedisNotificationKey(userId), JSON.stringify({ type, userId }))

      return notifications
    } catch (error) {
      await this.loggingService.throwErrorAndLog(error)
    }
  }

  async generateIds (data: Record<string, any[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async resetData (data: Record<string, any[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
