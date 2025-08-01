import { Inject, Injectable } from '@nestjs/common'
import { Component, prepareScopeForProxiesPermissions, PROXY_PERMISSIONS, setNestedValue, tCondition, tFragments, tProxy, tProxyFieldsValueUpdate, tProxyPaginatedResult, tProxyPermissionsObject, tProxyPermissionsValues, tSupportedLocales, UserPermissions } from '@smambu/lib.constantsjs'
import { EnvConfigsService, LoggingService } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Proxy } from 'src/schemas/proxy.schema'
import { URDomain } from 'src/schemas/domain.schema'
import { EvaluateExpressionService } from './evaluateExpression.service'

@Injectable()
export class ProxyService {
  constructor (
    @InjectModel(Proxy.name)
    private readonly proxyModel: Model<Proxy>,
    @InjectModel(URDomain.name)
    private readonly domainsModel: Model<URDomain>,
    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,
    private readonly evaluateExpressionService: EvaluateExpressionService,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.PROXY_SERVICE)
  }

  async getProxiesPaginatedList (page: number, pageSize: number): Promise<tProxyPaginatedResult> {
    try {
      const skip = (page - 1) * pageSize

      const total = await this.proxyModel.countDocuments().exec()

      const docs = await this.proxyModel
        .find({})
        .sort({ _id: 1 })
        .skip(skip)
        .limit(pageSize)
        .lean()

      const totalPages = Math.ceil(total / pageSize)

      const data: tProxy[] = docs.map(doc => ({
        id: doc._id.toHexString(),
        context: doc.context,
        contextKey: doc.contextKey,
        fragments: doc.fragments,
        domainId: doc.domainId,
        dynamicFields: doc.dynamicFields,
      }))

      const returnObj:tProxyPaginatedResult = { data, total, totalPages }

      return returnObj
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getProxyByContextKey (contextKey: string) {
    try {
      const proxies = this.proxyModel.find({ contextKey })

      return proxies
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getDomainProxiesPermissions (
    domainId: string,
  ): Promise<tProxyPermissionsObject> {
    try {
      const targetDomain = await this.domainsModel.findOne({ domainId }).lean()

      if (targetDomain == null)
        // XXX: this error cannot be translated with the current mechanism, but
        // also it should never happen - or at least pop up to the very tech-savy
        // user.
        // If we want to translate this, we might have to change the whole "toast"
        // error reporting system
        throw new Error(`Warning: domain ${domainId} does not exists`)

      const { canAccessProxies, canAccessProxyDetails, canEditProxy } = targetDomain

      return {
        canAccessProxies,
        canAccessProxyDetails,
        canEditProxy
      }
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async checkProxyPermission (
    domainId: string,
    requiredPermission: tProxyPermissionsValues,
    userPermissions: UserPermissions,
    selectedLocale: tSupportedLocales,
    headers: string,
    proxyId?: string
  ) {
    try {
      const permissions = await this.getDomainProxiesPermissions(domainId)

      let permissionExpression: tCondition
      switch (requiredPermission) {
        case PROXY_PERMISSIONS.CAN_ACCESS_PROXIES:
          permissionExpression = permissions.canAccessProxies
          break

        case PROXY_PERMISSIONS.CAN_ACCESS_PROXY_DETAILS:
          permissionExpression = permissions.canAccessProxyDetails
          break

        case PROXY_PERMISSIONS.CAN_EDIT_PROXY:
          permissionExpression = permissions.canEditProxy
          break
      }

      const scope = prepareScopeForProxiesPermissions(requiredPermission, proxyId)

      const accessEvalResults = await this.evaluateExpressionService.evaluateExpression({
        data: permissionExpression,
        scope,
        selectedLocale,
        userPermissions,
        authorization: headers,
      })

      const { error, evaluated } = accessEvalResults

      if (error != null)
        throw new Error('ur_user_proxy_permission_error')

      return evaluated.value
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateProxy (
    domainId: string,
    contextKey: string,
    updatedFieldsValues: tProxyFieldsValueUpdate,
    // TODO: ref #1436
    fragments?: tFragments,
  ) {
    try {
      const originalProxy = await this.proxyModel.findOne({ contextKey, domainId }).lean()

      if (originalProxy === null) {
        const translator = await this.envConfigClient.getTranslator()

        const errorMessage = translator.fromLabel('ur_proxy_domain_touple_not_found', {
          contextKey,
          domainId
        })

        throw new Error(errorMessage)
      }

      Object.entries(updatedFieldsValues)
        .forEach(([fieldId, value]) => {
          setNestedValue(originalProxy, fieldId, value)
        })

      // TODO: ref #1436
      await this.proxyModel.updateOne({
        domainId,
        contextKey,
      }, originalProxy)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }
}
