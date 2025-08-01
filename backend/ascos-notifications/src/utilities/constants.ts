export const NAMES = {
  NotificationsQueue: 'NotificationsQueue',
} as const

export const queueRetry = {
  attempts: 4,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
}
