export const NAMES = {
  CopierQueue: 'CopierQueue'
}

export const queueRetry = () => ({
  attempts: parseInt(process.env.CRON_RETRY_ATTEMPTS),
  backoff: {
    type: 'exponential',
    delay: parseInt(process.env.CRON_RETRY_DELAY),
  },
})
