import { IUserNotificationsRequest, IUserNotificationsResponse } from '@smambu/lib.constants'
import { notificationsClient, getNotificationsWatcherProps } from './apiClient'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { getReadableErrorMessage } from 'utilities/misc'

export class NotificationsApi {
  static async getUserNotifications ({
    page,
    limit
  }: IUserNotificationsRequest): Promise<IUserNotificationsResponse> {
    return notificationsClient
      .get(`/getUserNotifications/${page}?limit=${limit}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async markAsRead (): Promise<string> {
    return notificationsClient
      .put('/markAsRead')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async connectToSse (callback: (data: any) => void) {
    const notificationsWatcherProps = getNotificationsWatcherProps()
    const eventSource = new EventSourcePolyfill(notificationsWatcherProps.url,
      notificationsWatcherProps.options)
    eventSource.onmessage = (event: any) => {
      const data = JSON.parse(event.data)
      if (data.message === ':') return
      callback(data)
    }
  }
}
