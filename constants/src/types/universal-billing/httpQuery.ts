import { tExpression } from './expressions'

const SUPPORTED_URLS = {
  USER_API_URL: 'USER_API_URL',
}

type tSupportedUrls = keyof typeof SUPPORTED_URLS

export const SUPPORTED_HTTP_METHODS = {
  GET: 'GET',
}

export type tSupportedHttpMethods = keyof typeof SUPPORTED_HTTP_METHODS

type tBaseHttpExpression = {
  expressionKind: 'http'
  url: tSupportedUrls // eg. 'http://localhost:8020/api/user'
  path: tExpression // must resolve to string eg. '/getDoctors'
}

type tGetHttpExpression = tBaseHttpExpression & {
  method: 'GET'
}

/* In future we can add a post like this
type tPostHttpExpression = tBaseHttpExpression & {
  method: 'POST'
  body: tExpression // must resolve to object
}
*/

export type tHttpExpression = tGetHttpExpression
