import { ICapabilityName, tDependentValue, tEvaluatePermissions, tEvaluateUtilities, tHasCapabilityExpression, tHasOwnerInCapabilityExpression, tHasScopeExpression, tPermissionsExpression, tPermissionsOperators, UserPermissions } from '../../types'
import { convertDepsToEmits, getNewDeps, getNewEmits, joinEmits } from './dependenciesFunctions'
import { PERMISSIONS_DOMAINS_SCOPES } from '../../enums'

const getCapability = (expression: tPermissionsExpression) => {
  const capability = expression.capability as ICapabilityName
  if (capability === undefined) throw new Error('requestedCapabilityUndefined')

  return capability
}

const getUserPermissions = (utilities: tEvaluateUtilities) => {
  const userPermissions: UserPermissions = utilities.scope.self?.userPermissions as UserPermissions
  if (userPermissions === undefined)
    throw new Error('userPermissionsUndefined')

  return userPermissions
}

const getScope = (expression: tHasScopeExpression | tHasOwnerInCapabilityExpression) => {
  const scope = expression.scope
  if (scope === undefined) throw new Error('requestedScopeUndefined')

  return scope
}

export const evaluatePermissions = (
  utilities: tEvaluateUtilities,
): Record<tPermissionsOperators, tEvaluatePermissions> => ({
  hasCapability: async (expression): Promise<tDependentValue> => {
    const typedExpression = expression as tHasCapabilityExpression
    const capability = getCapability(typedExpression)

    const userPermissions = getUserPermissions(utilities)

    const userCapability = userPermissions[capability]

    const result = {
      value: userCapability != null,
      deps: getNewDeps([{ path: `scope.self.userPermissions.${capability}` }]),
      emits: getNewEmits()
    }

    return result
  },
  hasScope: async (expression): Promise<tDependentValue> => {
    const typedExpression = expression as tHasScopeExpression
    const capability = getCapability(typedExpression)
    const scope = getScope(typedExpression)
    const userPermissions = getUserPermissions(utilities)

    const userCapability = userPermissions[capability]

    const result = {
      value: userCapability != null && userCapability.scope === scope,
      deps: getNewDeps([{ path: `scope.self.userPermissions.${capability}` }]),
      emits: getNewEmits()
    }

    return result
  },
  hasOwnerInCapability: async (expression): Promise<tDependentValue> => {
    const typedExpression = expression as tHasOwnerInCapabilityExpression
    const capability = getCapability(typedExpression)
    const { value: ownerId, deps: ownerIDDeps, emits: ownerIDEmits } =
      await utilities.innerEvaluate(typedExpression.ownerId, utilities)

    const userPermissions = getUserPermissions(utilities)

    const userCapability = userPermissions[capability]

    const result = {
      value:
        userCapability != null &&
        (userCapability.scope === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
          userCapability.users.includes(ownerId)),
      deps: getNewDeps([{ path: `scope.self.userPermissions.${capability}` }]),
      emits: getNewEmits(joinEmits(convertDepsToEmits(ownerIDDeps), ownerIDEmits)),
    }

    return result
  }
})
