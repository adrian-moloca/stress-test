import React, { ReactNode } from 'react'
import ComponentError from './ComponentError'
import * as Sentry from '@sentry/react'

const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error }: { error: unknown }) => <ComponentError error={error as Error} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}

export default ErrorBoundary
