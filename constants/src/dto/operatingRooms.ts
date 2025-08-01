import { tOrScheduling } from '../types'

export type editOrSchedulingDto = Omit<tOrScheduling, 'tenantId'>[]
