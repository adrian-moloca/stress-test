import { tParsedUpdateProxyPayload, tProxyFieldsValueUpdate, tUpdateProxyPayload } from '@smambu/lib.constantsjs'

// TODO: ref #1436
export const parseProxyUpdatePayload = (payload:tUpdateProxyPayload): tParsedUpdateProxyPayload => {
  const { proxy, metadata } = payload

  const { dynamicFields, fragments } = proxy

  const updatedFieldsValues: tProxyFieldsValueUpdate = {}
  Object.entries(dynamicFields)
    .forEach(([fieldId, fieldValue]) => {
      const identifier = `dynamicFields.${fieldId}`
      const fieldWasTouched = metadata[identifier] != null

      if (fieldWasTouched)
        updatedFieldsValues[identifier] = fieldValue
    })

  return (
    {
      updatedFieldsValues,
      fragments
    }
  )
}
