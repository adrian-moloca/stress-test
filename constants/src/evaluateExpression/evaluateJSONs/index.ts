import * as binaryJSONs from './binaryJSONs'
import * as functions from './functions'
import * as literalJSONs from './literalJSONs'
import * as httpJSONs from './httpJSONs'
import * as queryJSONs from './queryJSONs'
import * as unaryJSONs from './unaryJSONs'
import * as namedExpressionJSONs from './namedExpressionJSONs'
import * as complexJSONs from './complexJSONs'
import * as permissionJSONs from './permissionJSONs'

export const evaluateJSONs = {
  ...binaryJSONs,
  ...functions,
  ...literalJSONs,
  ...httpJSONs,
  ...queryJSONs,
  ...unaryJSONs,
  ...namedExpressionJSONs,
  ...complexJSONs,
  ...permissionJSONs,
}
