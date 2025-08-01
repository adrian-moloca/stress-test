import { Capabilities, Component, IUser, I_PERMISSIONS_DOMAINS_SCOPES, PERMISSIONS_DOMAINS_SCOPES, PERMISSION_DOMAIN } from '@smambu/lib.constantsjs'
import { Injectable } from '@nestjs/common'
import { RolesService } from './roles.service'
import { LoggingService } from '@smambu/lib.commons-be'

@Injectable()
export class CapabilitiesService {
  constructor (
    private rolesService: RolesService,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.ROLES)
  }

  async getCapabilities (user: IUser) {
    try {
      const res = await this.rolesService.findRolesByID(
        user.roleAssociations.map(r => r.role),
      )
      const permissions = [].concat
        .apply(
          [],
          res.map(f =>
            f.capabilities.map(capability => {
              const scope = f.domain_scopes[
                PERMISSION_DOMAIN[
                  Object.keys(Capabilities).find(
                    key => Capabilities[key] === capability,
                  )
                ]
              ]

              let users
              switch (scope) {
                case PERMISSIONS_DOMAINS_SCOPES.OWN_DATA:
                  users = [user.id]
                  break

                case PERMISSIONS_DOMAINS_SCOPES.ALL_DATA:
                  users = []
                  break

                default:
                  users = [...user.roleAssociations.find(ra => ra.role === f.id).users, user.id]
                  break
              }

              return {
                [capability]: {
                  scope,
                  users,
                },
              }
            })),
        )
        .reduce(reducer, {})
      return permissions
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}

const reducer = (
  result,
  item: { [key: string]: { scope: string; users: string[] } },
) => {
  const [key, value] = Object.entries(item)[0]
  return {
    ...result,
    [key]: {
      scope:
        PERMISSION_SCOPE_GERARCHY[value.scope] >
          (PERMISSION_SCOPE_GERARCHY[result[key]?.scope] || 0)
          ? value.scope
          : result[key]?.scope,
      users: [...(result[key]?.users || []), ...value.users]
        .reduce((acc, userId) => (acc.includes(userId) ? acc : [...acc, userId]), []),
    },
  }
}

const PERMISSION_SCOPE_GERARCHY: Record<I_PERMISSIONS_DOMAINS_SCOPES, number> = {
  ALL_DATA: 3,
  ANOTHER_USER_DATA: 2,
  OWN_DATA: 1,
}
