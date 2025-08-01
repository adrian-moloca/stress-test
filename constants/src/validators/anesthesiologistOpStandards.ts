import { CreateAnesthesiologistOpStandardDto } from '../dto'

export const validateNewAnesthesiologistOpStandard = (data: any):
CreateAnesthesiologistOpStandardDto => ({
  name: data.name,
  validFrom: data.validFrom,
  createdBy: data.createdBy,
  preExistingConditions: data.preExistingConditions,
  interoperativeMeasure: data.interoperativeMeasure,
  materials: data.materials,
  medications: data.medications,
  ventilationMaterials: data.ventilationMaterials,
  positions: data.positions,
  requiredServices: data.requiredServices,
})
