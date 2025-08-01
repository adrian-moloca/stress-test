export const addTenantIdToString = (str: string) => {
  const tenantId = global.als.getStore()?.tenantId
  // TODO Tenants add this to catch errors
  // if (!tenantId) throw new Error('TenantId not found')

  return `${tenantId}-${str}`
}
