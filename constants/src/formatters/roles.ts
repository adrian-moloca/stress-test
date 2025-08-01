import { PERMISSION_DOMAINS, Capabilities, getStaticCapabilityNameDomain } from '../enums'
import { ICapabilityKey, ICapabilityName, IEditRoleRequest, IFormattedCapability, Role, tDynamicCapability, TranslatorLanguage } from '../types'

export const formatEditRoleRequest = (
  values: Partial<Role>,
): IEditRoleRequest => {
  const { name, scope, domain_scopes, capabilities } = values

  return {
    name: name ?? '',
    scope,
    domain_scopes,
    capabilities: capabilities ?? [],
  }
}

const formatStaticCapabilities = (
  trlb: (key: string) => string,
  input: Record<string, string>
) => {
  return Object.entries(input).map(([key, value]) => {
    const matching = value.match(/(.*[^:]):(.*[^:])/)

    if (matching == null)
      throw new Error('static capability value not matching regex')

    const name = trlb(matching[1])
    const permission = trlb(matching[2])
    const domain = getStaticCapabilityNameDomain(value as ICapabilityName)

    const retObj = {
      value: value as ICapabilityName,
      key: key as ICapabilityKey,
      name,
      permission,
      domain,
    }

    return retObj
  })
}

const formatDynamicCapabilities = (
  trlb: (key: string) => string,
  language: TranslatorLanguage,
  input: tDynamicCapability[]
) => {
  return input.reduce((acc, capability: tDynamicCapability) => {
    const matching = capability.value.match(/(.*[^:]):(.*[^:])/)

    if (matching == null)
      throw new Error('static capability value not matching regex')

    const key = matching[1] as ICapabilityKey
    const permission = trlb(matching[2])

    acc.capabilitiesList.push({
      value: capability.value as ICapabilityName,
      key,
      name: capability.labels[language],
      permission,
      domain: capability.domain,
    })

    if (!acc.domains[capability.domain])
      acc.domains[capability.domain] = capability.domain

    return acc
  }, { capabilitiesList: [] as IFormattedCapability[], domains: {} as Record<string, string> })
}

export const formatCapabilities = (
  trlb: (key: string) => string,
  language: TranslatorLanguage,
  dynamicCapabilities: tDynamicCapability[] | undefined,
) => {
  if (dynamicCapabilities == null)
    return ({
      capabilitiesList: formatStaticCapabilities(trlb, Capabilities),
      domains: PERMISSION_DOMAINS,
    })

  const formattedDynamicCapabilities = formatDynamicCapabilities(trlb,
    language,
    dynamicCapabilities)

  const staticCapabilites = formatStaticCapabilities(trlb, Capabilities)

  const result = {
    capabilitiesList: [
      ...staticCapabilites,
      ...formattedDynamicCapabilities.capabilitiesList,
    ],
    domains: {
      ...PERMISSION_DOMAINS,
      ...formattedDynamicCapabilities.domains,
    },
  }

  return result
}
