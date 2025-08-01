import { AnesthesiologistOpStandard } from '@smambu/lib.constants'

// eslint-disable-next-line max-len
export const formatAnesthesiologistOPStandardForm: any = (c: Partial<AnesthesiologistOpStandard>) => ({
  anesthesiologistOpStandardId: c?.anesthesiologistOpStandardId ?? '',
  createdBy: c?.createdBy ?? null,
  interoperativeMeasure: c?.interoperativeMeasure ?? [],
  materials: c?.materials ?? [],
  medications: c?.medications ?? [],
  ventilationMaterials: c?.ventilationMaterials ?? [],
  name: c?.name ?? null,
  positions: c?.positions ?? [],
  preExistingConditions: c?.preExistingConditions ?? [],
  requiredServices: c?.requiredServices ?? [],
  validFrom: c?.validFrom ?? null,
})
