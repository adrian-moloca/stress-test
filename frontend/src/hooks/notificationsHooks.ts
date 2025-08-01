import { useAppSelector } from 'store'
import React from 'react'
import {
  INotification,
  NotificationActionType,
  NotificationStatus,
  NotificationType,
  formatNotification,
} from '@smambu/lib.constants'
import { NotificationsApi } from 'api/notifications.api'
import { useNavigate } from 'react-router-dom'
import { isValid, startOfDay } from 'date-fns'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'

const LIMIT = import.meta.env.VITE_DEFAULT_NOTIFICATIONS_LIMIT || 20

export const useGetUserNotifications = () => {
  const user = useAppSelector(state => state.auth.user)
  const [notifications, setNotifications] = React.useState<INotification[]>([])
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [readedTimestamp, setReadedTimestamp] = React.useState<Date | null>(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const allReaded = React.useMemo(
    () => notifications
      .every((notification: INotification) => notification.status === NotificationStatus.READED),
    [notifications],
  )

  const getUserNotifications = React.useCallback(
    async (pageToCall?: number) => {
      if (!user) return
      if (pageToCall != null) setPage(pageToCall)
      setLoading(true)
      try {
        const response = await NotificationsApi.getUserNotifications({
          page: pageToCall ?? 1,
          limit: LIMIT,
        })
        const formattedNotifications = (response?.notifications ?? []).map(formatNotification)
        setUnreadCount(response?.unreadCount ?? 0)
        setNotifications(notifications =>
          [...notifications, ...formattedNotifications]
            .reduce((acc, curr: INotification) => {
              if (acc.find((n: INotification) => n._id === curr._id)) return acc
              return [...acc, curr]
            }, [] as INotification[])
            .sort((a: INotification,
              b: INotification) => b.createdAt?.getTime?.() - a.createdAt?.getTime?.()))
        if (formattedNotifications.length < LIMIT) setHasMore(false)
      } catch (error) {
        console.error(error)
      }
      setLoading(false)
    },
    [user],
  )

  const loadMore = () => {
    if (loading || !hasMore) return
    getUserNotifications(page + 1)
  }

  const changeDrawerState = React.useCallback(async () => {
    if (!user?.id) return
    try {
      const newOpen = !open
      setOpen(newOpen)
      if (!newOpen) return
      const response = await NotificationsApi.markAsRead()
      const timestamp = new Date(response)
      if (isValid(timestamp)) {
        setUnreadCount(0)
        setNotifications(notifications =>
          notifications.map((notification: INotification) => ({
            ...notification,
            status: notification.status === NotificationStatus.SENT
              ? NotificationStatus.READED
              : notification.status,
            readedAt: notification?.readedAt ?? timestamp,
          })))
        setReadedTimestamp(timestamp)
      }
    } catch (error) {
      console.error(error)
    }
  }, [user?.id, open])

  const actOnNotification = (notification: INotification) => {
    try {
      setOpen(false)
      switch (notification?.action?.type) {
        case NotificationActionType.INTERNAL_LINK:
          if (notification.action.url) navigate(notification.action.url)

          const actionDate = notification.action.date != null && new Date(notification.action.date)
          if (actionDate && isValid(actionDate))
            dispatch({ type: GLOBAL_ACTION.SET_SELECTED_DATE, data: startOfDay(actionDate) })
          break
        default:
          break
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Get user notifications when a new user is logged
  React.useEffect(() => {
    if (!user?.id) return
    setNotifications([])
    getUserNotifications(1)
  }, [getUserNotifications, user?.id])

  // Connect to SSE to get new notifications
  React.useEffect(() => {
    const connectToSse = async () => {
      if (!user?.id) return
      try {
        return NotificationsApi.connectToSse(data => {
          if (Object.values(NotificationType).includes(data?.type)) getUserNotifications()
        })
      } catch (error) {
        console.error(error)
      }
    }
    connectToSse()
  }, [user?.id, getUserNotifications])

  const unreadNotificationsIds = React.useMemo(
    () =>
      notifications
        .filter(
          (notification: INotification) =>
            notification.status === NotificationStatus.SENT ||
            !notification.readedAt ||
            (isValid(readedTimestamp) &&
            notification.readedAt?.getTime?.() >= readedTimestamp!?.getTime?.()),
        )
        .map(notification => notification._id),
    [notifications],
  )

  return {
    open,
    changeDrawerState,
    notifications,
    getUserNotifications,
    loading,
    hasMore,
    loadMore,
    unreadCount,
    allReaded,
    actOnNotification,
    unreadNotificationsIds,
  }
}
