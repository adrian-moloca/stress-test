import { tExpression } from '../expressions'

// Note for the future: this is kept as a separate type for an easier future
// refactoring / further implementations
export type tFragmentValues = {
  [key: string]: tExpression
}
