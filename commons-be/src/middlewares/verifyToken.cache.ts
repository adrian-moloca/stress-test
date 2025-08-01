// a class to cache the auth, user and userPermissions

import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Component, IUser, UserPermissions, callMSWithTimeoutAndRetry } from '@smambu/lib.constantsjs'
import { ClientProxy } from '@nestjs/microservices'

@Injectable()
export class VerifyTokenCache {
  private cache = {} as Record<string, { user: IUser;
    permissions: UserPermissions;
    cachedDate: Date }>

  constructor () {}

  async getData ({
    authClient,
    userClient,
    roleClient,
    token,
    getUser,
  }: {
    authClient: ClientProxy
    userClient?: ClientProxy
    roleClient?: ClientProxy
    token: string
    getUser?: (id: string) => Promise<IUser>
  }) {
    const cacheTimeMS = !isNaN(Number(process.env.VERIFY_TOKEN_CACHE_MS))
      ? Number(process.env.VERIFY_TOKEN_CACHE_MS)
      : 1000 * 10

    let userResponse = null
    let permissionsResponse = null
    let authResponse = null
    if (this.cache[token] &&
      this.cache[token].cachedDate > new Date(new Date().getTime() - cacheTimeMS))
      return this.cache[token]

    try {
      const checkAuthPattern = { role: 'auth', cmd: 'check' }

      const checkAuthPayloadData = { jwt: token }
      authResponse = await callMSWithTimeoutAndRetry(authClient,
        checkAuthPattern,
        checkAuthPayloadData,
        Component.COMMONS_BE)
    } catch (e) {
      console.error('Error while authenticating token', e)
      throw new HttpException(
        {
          error: true,
          stackTrace: e,
        },
        HttpStatus.UNAUTHORIZED,
      )
    }
    if (!authResponse?.sub) throw new Error('error_invalidToken')

    if (userClient == null && getUser == null) throw new Error('Error: cannot retrieve user')
    if (userClient != null) {
      try {
        const getUserDetailPattern = { role: 'user', cmd: 'getUserDetail' }

        const getUserDetailPayloadData = { id: authResponse.sub }
        userResponse = await callMSWithTimeoutAndRetry(userClient,
          getUserDetailPattern,
          getUserDetailPayloadData,
          Component.COMMONS_BE) as IUser
      } catch (e) {
        console.error('Error while retrieving user from token', e)
        throw new HttpException(
          {
            error: true,
            stackTrace: e,
          },
          HttpStatus.UNAUTHORIZED,
        )
      }
      if (userResponse == null) throw new Error('error_invalidToken')
    } else {
      userResponse = await getUser!(authResponse.sub)
    }

    if (roleClient != null)
      try {
        const getPermissionPattern = { role: 'permissions', cmd: 'get' }

        permissionsResponse = await callMSWithTimeoutAndRetry(roleClient,
          getPermissionPattern,
          userResponse,
          Component.COMMONS_BE)
      } catch (e) {
        console.error('Error while retrieving permissions for user', e)
        throw new HttpException(
          {
            error: true,
            stackTrace: e,
          },
          HttpStatus.UNAUTHORIZED,
        )
      }

    this.cache[token] = {
      user: userResponse!,
      permissions: permissionsResponse,
      cachedDate: new Date()
    }

    return { user: userResponse, permissions: permissionsResponse }
  }
}
