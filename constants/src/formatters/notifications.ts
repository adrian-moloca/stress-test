import { isValid } from 'date-fns'
import { INotification } from '../types'
import { NotificationType, NotificationActionType, Component } from '../enums'
import { ClientProxy } from '@nestjs/microservices'
import { callMSWithTimeoutAndRetry } from '../utils'

export const formatNotification = (notification: any): INotification => ({
  ...notification,
  createdAt: isValid(new Date(notification.createdAt)) ? new Date(notification.createdAt) : null,
  updatedAt: isValid(new Date(notification.updatedAt)) ? new Date(notification.updatedAt) : null,
  readedAt: isValid(new Date(notification.readedAt)) ? new Date(notification.readedAt) : null,
})

export const createNotifications = async (
  notificationsClient: ClientProxy,
  {
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
    action?: {
      type: NotificationActionType
      url: string
      date?: Date
    }
  },
): Promise<INotification | null> => {
  const cleanedUsersIds = usersIds.reduce((acc, userId) => {
    if (typeof userId === 'string' && !acc.includes(userId)) acc.push(userId)

    return acc
  }, [] as string[])

  if (!cleanedUsersIds.length) return null
  const pattern = { role: 'notifications', cmd: 'create' }

  const payloadData = {
    usersIds: cleanedUsersIds,
    type,
    title,
    body,
    action,
  }

  const notification = await callMSWithTimeoutAndRetry(notificationsClient,
    pattern,
    payloadData,
    Component.CONSTANTS)

  return notification
}
