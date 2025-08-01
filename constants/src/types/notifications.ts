import { NotificationActionType, NotificationStatus, NotificationType } from '../enums'

export interface INotification {
  tenantId: string
  _id: string
  to: string
  status: NotificationStatus
  type: NotificationType
  title: string
  body: string
  action: {
    type: NotificationActionType | null
    url?: string
    date?: Date
  }
  createdAt: Date
  updatedAt: Date
  readedAt: Date
}

export interface IUserNotificationsRequest {
  page: number
  limit: number
}

export interface IUserNotificationsResponse {
  notifications: INotification[]
  unreadCount: number
  page: number
  limit: number
}
