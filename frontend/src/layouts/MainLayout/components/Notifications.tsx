import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  Typography,
  IconButton,
  CircularProgress,
  Button,
  Badge,
} from '@mui/material'
import { format, isSameDay } from 'date-fns'
import React from 'react'
import { DrawerHeader } from '../../../components/MenuDrawer'

import { NotificationsNone, NotificationsActive, AdsClick } from '@mui/icons-material'
import { INotification } from '@smambu/lib.constants'
import { useGetUserNotifications } from 'hooks/notificationsHooks'
import useOnScreen from 'hooks/uiHooks'
import { trlb } from 'utilities'

const Notifications = () => {
  const {
    open,
    changeDrawerState,
    loading,
    notifications,
    hasMore,
    loadMore,
    unreadCount,
    allReaded,
    actOnNotification,
    unreadNotificationsIds,
  } = useGetUserNotifications()

  return (
    <>
      <Badge
        badgeContent={unreadCount}
        color='secondary'
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        overlap='circular'
        componentsProps={{
          badge: {
            style: {
              fontSize: '0.6rem',
              padding: 0,
            },
          },
        }}
      >
        <IconButton onClick={changeDrawerState} sx={{ mr: 2 }}>
          {allReaded ? <NotificationsNone /> : <NotificationsActive />}
        </IconButton>
      </Badge>
      <Drawer anchor='right' open={open} onClose={changeDrawerState} PaperProps={{ sx: { overflowX: 'hidden' } }}>
        <DrawerHeader />
        <List sx={{ maxWidth: 250 }}>
          {notifications.map(notification => (
            <React.Fragment key={notification._id}>
              <NotificationItem
                notification={notification}
                actOnNotification={actOnNotification}
                readed={!unreadNotificationsIds.includes(notification._id)}
              />
              <Divider />
            </React.Fragment>
          ))}
        </List>
        <NotificationLoadMore
          loading={loading}
          hasMore={hasMore}
          loadMore={loadMore}
          noNotifications={!notifications.length}
        />
      </Drawer>
    </>
  )
}

const NotificationLoadMore = ({
  loading,
  hasMore,
  loadMore,
  noNotifications,
}: {
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  noNotifications: boolean
}) => {
  const { isIntersecting, ref } = useOnScreen()

  React.useEffect(() => {
    if (isIntersecting && hasMore && !loading) loadMore()
  }, [isIntersecting, hasMore, loading])

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        mb: 2,
        px: 2,
      }}
    >
      {loading ? <CircularProgress /> : null}
      {!loading && hasMore ? <Button onClick={loadMore}>{trlb('notifications_loadMore')}</Button> : null}
      {!loading && !hasMore && noNotifications
        ? (
          <Typography variant='caption' color='textSecondary'>
            {trlb('notifications_noNotifications')}
          </Typography>
        )
        : null}
      {!loading && !hasMore && !noNotifications
        ? (
          <Typography variant='caption' color='textSecondary'>
            {trlb('notifications_noMoreNotifications')}
          </Typography>
        )
        : null}
    </Box>
  )
}

const NotificationItem = ({
  notification,
  actOnNotification,
  readed,
}: {
  notification: INotification
  actOnNotification: (notification: INotification) => void
  readed?: boolean
}) => {
  const actionable = notification.action?.type != null
  return (
    <ListItem
      sx={{
        bgcolor: readed ? 'inherit' : 'panel.main',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
          cursor: actionable ? 'cursor' : 'default',
        }}
      >
        {actionable
          ? (
            <IconButton size='small' sx={{ p: 0, mr: 1 }} onClick={() => actOnNotification(notification)}>
              <AdsClick />
            </IconButton>
          )
          : null}
        <Typography variant='h6' color='textSecondary'>
          {trlb(notification.title)}
        </Typography>
        {readed ? null : <NotificationDot />}
      </Box>
      <Typography variant='body2' color='textSecondary'>
        {trlb(notification.body)}
      </Typography>
      <Typography variant='caption' color='textSecondary'>
        {format(
          notification.createdAt,
          trlb(isSameDay(notification.createdAt, new Date()) ? 'dateTime_time_string' : 'dateTime_dayMonthTime_string'),
        )}
      </Typography>
    </ListItem>
  )
}

const NotificationDot = () => {
  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        height: 12,
        width: 12,
        borderRadius: 12,
        ml: 1,
      }}
    />
  )
}

export default Notifications
