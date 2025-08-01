import { tEvaluatedContainerRepresentation, tEvaluatedFieldRepresentation, tEvaluatedViewItem } from 'universal-reporting/types/tEvaluatedTypes'

export const isEvaluatedFieldRepresentation = (item: tEvaluatedViewItem):
item is tEvaluatedFieldRepresentation => {
  return 'fieldId' in item &&
    'viewAs' in item &&
    'hide' in item &&
    'required' in item &&
    'description' in item &&
    'label' in item &&
    'margin' in item &&
    'span' in item
}

// TODO: not implemented. container representation might be deprecated soon.
export const isEvaluatedContainerRepresentation = (item: tEvaluatedViewItem):
item is tEvaluatedContainerRepresentation => {
  return !isEvaluatedFieldRepresentation(item)
}
