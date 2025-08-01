import { tEntityUpdateFunc, tTargetableEntities } from '@smambu/lib.constants'
import { tUpdatePayload } from 'universal-reporting/types'

export const createFrontendEntityUpdateFunctionsMap = (
  setValues: (values: tUpdatePayload[]) => void
): Record<tTargetableEntities, tEntityUpdateFunc> => {
  const updateFun = async (
    _id: string,
    updatePayload: Record<string, unknown>,
  ): Promise<void> => {
    const updatedPayload: tUpdatePayload[] = []

    Object.entries(updatePayload).forEach(([key, value]) => {
      updatedPayload.push({ path: key, value })
    })
    setValues(updatedPayload)
  }

  const defaultUpdateFun = async (
    _id: string,
    updatePayload: Record<string, unknown>
  ): Promise<void> => {
    updateFun(_id, updatePayload)
  }

  return {
    data: defaultUpdateFun,
    fields: defaultUpdateFun,
    representationstring: defaultUpdateFun,
    representationnumber: defaultUpdateFun,
    representationboolean: defaultUpdateFun,
    representationobject: defaultUpdateFun,
    representationdate: defaultUpdateFun,
    representationdateWithoutTimestamp: defaultUpdateFun,
    representationtimestamp: defaultUpdateFun,
    representationemail: defaultUpdateFun,
    representationprice: defaultUpdateFun,
    representationuniqueId: defaultUpdateFun,
    representationtextWithPattern: defaultUpdateFun,
    representationpositiveNumber: defaultUpdateFun,
    representationpositivePrice: defaultUpdateFun,
    representationlocalizedText: defaultUpdateFun,
    representationtwoDecimalNumber: defaultUpdateFun,
    representationtable: defaultUpdateFun,
    representationlist: defaultUpdateFun,
    representationaccordion: defaultUpdateFun,
    representationenum: defaultUpdateFun,
    proxy: async (_id: string, _updatePayload: Record<string, unknown>): Promise<void> => {
      throw new Error('PROXY ENTITY NOT SUPPORTED FRONTEND.')
    },
    case: async (_id: string, _updatePayload: Record<string, unknown>): Promise<void> => {
      throw new Error('CASE ENTITY NOT SUPPORTED FRONTEND.')
    },
  }
}
