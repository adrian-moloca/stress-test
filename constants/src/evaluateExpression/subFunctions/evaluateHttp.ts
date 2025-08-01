import { getHttpUrls } from '../../httpUrls'
import { tEvaluateHttp, tEvaluateUtilities, tSupportedHttpMethods } from '../../types'
import { convertDepsToEmits, getNewDeps, joinEmits } from './dependenciesFunctions'

export const evaluateHttp = (
  utilities: tEvaluateUtilities
): Record<tSupportedHttpMethods, tEvaluateHttp> => ({
  GET: async expression => {
    const { value: path, deps, emits } = await utilities.innerEvaluate(expression.path, utilities)
    const urls = getHttpUrls(process.env)
    const url = urls[expression.url]

    if (utilities.executeHttp == null) throw new Error('executeHttpNotDefined')

    const completeUrl = `${url}${path}`
    const result = await utilities.executeHttp('GET', completeUrl, undefined)

    return {
      value: result,
      deps: getNewDeps(),
      emits: joinEmits(
        convertDepsToEmits(deps),
        emits,
      )
    }
  }
})
