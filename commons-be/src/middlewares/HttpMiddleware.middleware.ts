import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { ClientProxy } from '@nestjs/microservices'
import { Component, IGenericError, IUser, UserPermissions, callMSWithTimeoutAndRetry, tAsyncLocalStorage } from '@smambu/lib.constantsjs'
import { AsyncLocalStorage } from 'async_hooks'

interface RequestWithUser extends Request {
  user?: IUser
  permissions?: UserPermissions
  tenantId?: string
}

const injectTokenData = async (
  req: RequestWithUser,
  next: NextFunction,
  als: AsyncLocalStorage<tAsyncLocalStorage>,
  validateRes: any,
) => {
  req.user = validateRes.user
  req.permissions = validateRes.permissions
  req.tenantId = validateRes.tenantId

  // TODO: ref #1437
  const store:tAsyncLocalStorage = {
    tenantId: validateRes.tenantId,
    userPermissions: validateRes.permissions
  }

  await als.run(store, () => next())
}

@Injectable()
export class HttpMiddleware implements NestMiddleware {
  constructor (
    @Inject('AUTH_CLIENT') private readonly authClient: ClientProxy,
    private readonly als: AsyncLocalStorage<{ tenantId: string }>,
  ) {
    global.als = this.als
  }

  async use (req: RequestWithUser, _res: Response, next: NextFunction) {
    try {
      const pattern = { role: 'auth', cmd: 'validateToken' }

      const payloadData = { authorization: req.headers.authorization }

      const validateRes = await callMSWithTimeoutAndRetry(this.authClient,
        pattern,
        payloadData,
        Component.COMMONS_BE)

      return injectTokenData(req, next, this.als, validateRes)
    } catch (e: unknown) {
      const errPayload = new UnauthorizedException((e as IGenericError).message)

      next(errPayload)
    }
  }
}
