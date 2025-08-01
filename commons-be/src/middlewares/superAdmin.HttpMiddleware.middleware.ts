import { HttpException, HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { ClientProxy } from '@nestjs/microservices'
import { Component, ICredential, callMSWithTimeoutAndRetry } from '@smambu/lib.constantsjs'
import { AsyncLocalStorage } from 'async_hooks'

interface RequestWithUser extends Request {
  email?: string
}

const injectTokenData = async (
  req: RequestWithUser,
  next: NextFunction,
  als: AsyncLocalStorage<{ bypassTenant: boolean }>,
  validateRes: any,
) => {
  req.email = validateRes.email

  const store = { bypassTenant: true }
  await als.run(store, () => next())
}

@Injectable()
export class SuperAdminHttpMiddleware implements NestMiddleware {
  constructor (
    @Inject('AUTH_CLIENT') private readonly authClient: ClientProxy,
    @Inject('USERS_CLIENT') private readonly usersClient: ClientProxy,
    private readonly als: AsyncLocalStorage<{ bypassTenant: boolean }>,
  ) {
    global.als = this.als
  }

  async checkIsSuperAdmin (email: string) {
    // const pattern = { role: 'credential', cmd: 'getCredentialsByEmail' }

    // const payloadData = { email }

    // const credentialData: ICredential = await callMSWithTimeoutAndRetry(this.usersClient,
    //   pattern,
    //   payloadData,
    //   Component.COMMONS_BE)

    // if (!credentialData.isSuperAdmin) throw new Error('Unauthorized')

    return true
  }

  async use (req: RequestWithUser, _res: Response, next: NextFunction) {
    const pattern = { role: 'auth', cmd: 'validateTokenWithoutTenant' }

    const payloadData = { authorization: req.headers.authorization }
    const validateRes = await callMSWithTimeoutAndRetry(this.authClient,
      pattern,
      payloadData,
      Component.COMMONS_BE)

    await this.checkIsSuperAdmin(validateRes.email)

    return injectTokenData(req, next, this.als, validateRes)
  }

  handleError (message: string) {
    throw new HttpException(
      {
        error: true,
        stackTrace: message,
      },
      HttpStatus.UNAUTHORIZED,
    )
  }
}
