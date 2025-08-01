import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core'

const ignoreErrors = [
  'error_userNotActive',
  'error_userNotExist',
  'user_emailAlreadyExists_error',
  'error_emailOrPasswordNotCorrect',
  'create_invoice_error_case_incomplete',
  /"billing[A-Z0-9]*\.minimumCharge" is required/,
  /"billing[A-Z0-9]*\.firstHourFee" is required/,
  /"billing[A-Z0-9]*\.halfHourFee" is required/,
  /"billing[A-Z0-9]*\.scenario" is required/,
  'operating_room_used_error',
]

export const initSentry = async () => {
  const { SENTRY_BE_DSN, VITE_APP_ENV, VITE_DISABLE_SENTRY } = process.env

  if (SENTRY_BE_DSN == null || VITE_DISABLE_SENTRY === 'true') return false

  await Sentry.init({
    dsn: SENTRY_BE_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,

    environment: VITE_APP_ENV,

    ignoreErrors,
  })

  return true
}

export const linkSentry = async (app: any) => {
  const { httpAdapter } = app.get(HttpAdapterHost)

  await Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter))
}

export const captureException = (error: any, tags: [string, string][]) => {
  Sentry.withScope(function (scope) {
    tags.forEach(([key, value]) => {
      scope.setTag(key, value)
    })

    Sentry.captureException(error)
  })
}

export const captureMessage = (message: string) => {
  Sentry.captureMessage(message)
}
