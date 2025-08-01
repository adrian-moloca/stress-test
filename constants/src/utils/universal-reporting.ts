import { SCOPEABLE_TARGET, tScope, tScopeableTarget } from '../types'

export const prepareScopeForProxiesPermissions = (target: tScopeableTarget,
  entityId?: string):tScope => {
  switch (target) {
    case SCOPEABLE_TARGET.CAN_ACCESS_PROXIES:
      return {}

    case SCOPEABLE_TARGET.CAN_ACCESS_PROXY_DETAILS:
    case SCOPEABLE_TARGET.CAN_EDIT_PROXY:
      return { proxyId: entityId }

    default:
      throw Error(`Target ${target} has no scope function defined`)
  }
}
