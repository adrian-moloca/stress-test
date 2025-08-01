import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { Component, IGenericError, Level, callMSWithTimeoutAndRetry, parseErrorMessage } from '@smambu/lib.constantsjs'

@Injectable()
export class LoggingService {
  component: Component | null = null
  logger: Logger | null = null

  constructor (
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
  ) {}

  setComponent (component: Component): void {
    this.component = component
    this.logger = new Logger(`${component} logger`)
  }

  getTenantParams = () => {
    const store = global.als.getStore()

    const params = {} as { tenantId?: string; bypassTenant?: boolean }

    if (store?.tenantId != null) params.tenantId = store.tenantId
    else if (store?.bypassTenant) params.bypassTenant = true

    return params
  }

  checkLogger (): asserts this is { component: Component; logger: Logger } {
    if (this.component == null)
      throw new Error('Component is not set')

    if (this.logger === null)
      throw new Error('Logger is not set')
  }

  async throwErrorAndLog (e: IGenericError): Promise<never> {
    this.checkLogger()

    console.error(e)
    const message = parseErrorMessage(e)
    const pattern = { role: 'log', cmd: 'createOne' }

    const payloadData = {
      component: this.component,
      level: Level.ERROR,
      message,
      ...this.getTenantParams(),
    }

    await callMSWithTimeoutAndRetry(this.logClient,
      pattern,
      payloadData,
      this.component)

    throw new Error(message)
  }

  private log (message: string, level: Level) {
    const pattern = { role: 'log', cmd: 'createOne' }

    const payloadData = {
      component: this.component,
      level,
      message,
      ...this.getTenantParams(),
    }
    let parsedComponent = this.component
    if (this.component == null)
      parsedComponent = Component.MISSING_COMPONENT

    callMSWithTimeoutAndRetry(this.logClient,
      pattern,
      payloadData,
      parsedComponent!)
  }

  logDebug (message: string) {
    this.checkLogger()

    this.log(message, Level.DEBUG)
    this.logger.debug(message)
  }

  logInfo (message: string, writeOnDb: boolean = true) {
    this.checkLogger()

    this.logger.log(message)
    if (writeOnDb) this.log(message, Level.INFO)
  }

  logWarn (message: string) {
    this.checkLogger()

    this.logger.warn(message)
    this.log(message, Level.WARNING)
  }

  logError (message: string) {
    this.checkLogger()

    this.logger.error(message)
    this.log(message, Level.ERROR)
  }
}
