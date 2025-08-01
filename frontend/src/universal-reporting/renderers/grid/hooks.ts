import { useDebounce } from 'hooks'
import React from 'react'
import { tEvaluatedFieldRepresentation } from 'universal-reporting/types/tEvaluatedTypes'
import { trlb } from 'utilities'

const useUpdatePath = (fieldRepresentation: tEvaluatedFieldRepresentation, path: string) => {
  const getPath = React.useMemo(() => {
    const isAbsolutePath: boolean = fieldRepresentation.fieldId.startsWith('/')
    if (isAbsolutePath)
      return fieldRepresentation.fieldId.slice(1)
    if (!path)
      return fieldRepresentation.fieldId
    return `${path}`
  }, [fieldRepresentation.fieldId, path])

  return getPath
}

interface UseFieldLogicProps<T> {
  data: T;
  fieldRepresentation: tEvaluatedFieldRepresentation;
  update: (data: { path: string; value: any }) => void;
  path: string;
}

export const useFieldLogic = <T, >({
  data,
  fieldRepresentation,
  update,
  path,
}: UseFieldLogicProps<T>) => {
  const getUpdatePath = useUpdatePath(fieldRepresentation, path)
  const [componentData, setComponentData] = React.useState<T>(data)

  React.useEffect(() => {
    if (fieldRepresentation.displayExpression !== undefined)
      setComponentData(fieldRepresentation.displayExpression)
    else
      setComponentData(data)
  }, [data, fieldRepresentation.displayExpression])

  const debouncedComponentData = useDebounce(componentData, 500)

  React.useEffect(() => {
    if (debouncedComponentData !== data)
      update({ path: getUpdatePath, value: debouncedComponentData })
  }, [debouncedComponentData])

  const error = fieldRepresentation.required && !componentData ? trlb('commons_required') : undefined

  return { componentData, setComponentData, error }
}
