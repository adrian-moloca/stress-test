import * as Sentry from '@sentry/react'

const {
  VITE_APP_ENV,
  VITE_SENTRY_FE_DSN,
  VITE_BACKEND_DOMAIN,
  VITE_DISABLE_SENTRY
} = import.meta.env

if (VITE_SENTRY_FE_DSN != null && VITE_DISABLE_SENTRY !== 'true')
  Sentry.init({
    dsn: VITE_SENTRY_FE_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [VITE_BACKEND_DOMAIN],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    environment: VITE_APP_ENV,
  })
