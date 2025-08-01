import axios, { InternalAxiosRequestConfig } from 'axios'

import { getHttpUrls } from '@smambu/lib.constants'
import { getLocalStorageItem } from 'utilities'
import { getReadableErrorMessage } from 'utilities/misc'

const {
  AUTH_API_URL,
  USER_API_URL,
  ROLE_API_URL,
  ANAGRAPHICS_API_URL,
  CONTRACT_API_URL,
  SCHEDULING_CASES_API_URL,
  SYSTEM_CONFIGURATION_API_URL,
  OR_MANAGEMENT_API_URL,
  PATIENTS_API_URL,
  BUCKET_API_URL,
  LOG_API_URL,
  BILLING_API_URL,
  NOTIFICATIONS_API_URL,
  TENANTS_API_URL,
  UR_API_URL,
} = getHttpUrls(import.meta.env)

const ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN || 'ascos-token'
const ACCESS_TOKEN_WITHOUT_TENANT = (import.meta.env.VITE_ACCESS_TOKEN || 'ascos-token') + '_without_tenant'

const requestMiddleware = (request: InternalAxiosRequestConfig<any>) => {
  const accessToken = getLocalStorageItem(ACCESS_TOKEN)
  const accessTokenWithoutTenant = getLocalStorageItem(ACCESS_TOKEN_WITHOUT_TENANT)

  if (accessToken && request.headers) request.headers.Authorization = `Bearer ${accessToken}`
  else if (accessTokenWithoutTenant && request.headers)
    request.headers.Authorization = `Bearer ${accessTokenWithoutTenant}`

  return request
}

const rejectMiddleware = async (error: any) => {
  const readableError = getReadableErrorMessage(error)

  return Promise.reject(new Error(readableError))
}

const authClient = axios.create({
  baseURL: AUTH_API_URL,
})
authClient.interceptors.request.use(requestMiddleware)
authClient.interceptors.response.use(undefined, rejectMiddleware)

const userClient = axios.create({
  baseURL: USER_API_URL,
})
userClient.interceptors.request.use(requestMiddleware)
userClient.interceptors.response.use(undefined, rejectMiddleware)

const roleClient = axios.create({
  baseURL: ROLE_API_URL,
})
roleClient.interceptors.request.use(requestMiddleware)
roleClient.interceptors.response.use(undefined, rejectMiddleware)

const contractClient = axios.create({
  baseURL: CONTRACT_API_URL,
})
contractClient.interceptors.request.use(requestMiddleware)
contractClient.interceptors.response.use(undefined, rejectMiddleware)

const anagraphicsClient = axios.create({
  baseURL: ANAGRAPHICS_API_URL,
})
anagraphicsClient.interceptors.request.use(requestMiddleware)
anagraphicsClient.interceptors.response.use(undefined, rejectMiddleware)

const schedulingCasesClient = axios.create({
  baseURL: SCHEDULING_CASES_API_URL,
})
schedulingCasesClient.interceptors.request.use(requestMiddleware)
schedulingCasesClient.interceptors.response.use(undefined, rejectMiddleware)

const systemConfigurationClient = axios.create({
  baseURL: SYSTEM_CONFIGURATION_API_URL,
})
systemConfigurationClient.interceptors.request.use(requestMiddleware)
systemConfigurationClient.interceptors.response.use(undefined, rejectMiddleware)

const operatingRoomClient = axios.create({
  baseURL: OR_MANAGEMENT_API_URL,
})
operatingRoomClient.interceptors.request.use(requestMiddleware)
operatingRoomClient.interceptors.response.use(undefined, rejectMiddleware)

const patientsClient = axios.create({
  baseURL: PATIENTS_API_URL,
})
patientsClient.interceptors.request.use(requestMiddleware)
patientsClient.interceptors.response.use(undefined, rejectMiddleware)

const bucketClient = axios.create({
  baseURL: BUCKET_API_URL,
})
bucketClient.interceptors.request.use(requestMiddleware)
bucketClient.interceptors.response.use(undefined, rejectMiddleware)

const logClient = axios.create({
  baseURL: LOG_API_URL,
})
logClient.interceptors.request.use(requestMiddleware)
logClient.interceptors.response.use(undefined, rejectMiddleware)

const billingClient = axios.create({
  baseURL: BILLING_API_URL,
})
billingClient.interceptors.request.use(requestMiddleware)
billingClient.interceptors.response.use(undefined, rejectMiddleware)

const notificationsClient = axios.create({
  baseURL: NOTIFICATIONS_API_URL,
})
notificationsClient.interceptors.request.use(requestMiddleware)
notificationsClient.interceptors.response.use(undefined, rejectMiddleware)
const getNotificationsWatcherProps = () => ({
  url: `${NOTIFICATIONS_API_URL}/watchUserNotifications`,
  options: { headers: { Authorization: `Bearer ${getLocalStorageItem(ACCESS_TOKEN)}` } },
})

const tenantsClient = axios.create({
  baseURL: TENANTS_API_URL,
})
tenantsClient.interceptors.request.use(requestMiddleware)
tenantsClient.interceptors.response.use(undefined, rejectMiddleware)

const urClient = axios.create({
  baseURL: UR_API_URL,
})
urClient.interceptors.request.use(requestMiddleware)
urClient.interceptors.response.use(undefined, rejectMiddleware)

export {
  authClient,
  userClient,
  roleClient,
  anagraphicsClient,
  contractClient,
  systemConfigurationClient,
  schedulingCasesClient,
  patientsClient,
  bucketClient,
  logClient,
  operatingRoomClient,
  billingClient,
  notificationsClient,
  getNotificationsWatcherProps,
  tenantsClient,
  urClient,
}
