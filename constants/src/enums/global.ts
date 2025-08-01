/* eslint-disable no-unused-vars */
export enum ToastType {
  success = 'success',
  error = 'error',
  warning = 'warning',
  info = 'info',
}

export enum filtersSections {
  CASES_BILLING = 'CASES_BILLING',
  CONTRACTS = 'CONTRACTS',
  CASES_MATERIALS = 'CASES_MATERIALS',
  PC_MATERIALS_CASES = 'PC_MATERIALS_CASES',
}

export const OBJECT_DIFF_EVENTS = {
  CREATED: 'CREATED',
  DELETED: 'DELETED',
  UPDATED: 'UPDATED'
} as const
