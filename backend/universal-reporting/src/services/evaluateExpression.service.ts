import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { tExpression, callMSWithTimeoutAndRetry, tExpressionResult, tTestError, IGenericError, tSupportedQueriesCollections, tScope, tSupportedLocales, evaluateExpression, tExecuteHttp, evaluateJSONs, tExecuteQueryPayload, Component, tExecuteQueryData, UserPermissions, tEvaluateNamedExpressionData, getNewEmissions, getGenericExecuteHttp, QUERY_CONFIGURATIONS } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { NamedExpression } from 'src/schemas/namedExpression.schema'

@Injectable()
export class EvaluateExpressionService {
  constructor (
    @InjectModel(NamedExpression.name)
    private readonly namedExpressionModel: Model<NamedExpression>,
    private loggingService: LoggingService,
    @Inject('USERS_CLIENT') private readonly usersClient: ClientProxy,
    @Inject('ANAGRAPHICS_CLIENT') private readonly anagraphicsClient: ClientProxy,
    @Inject('SYSTEM_CONFIGURATION_CLIENT') private readonly systemConfigurationClient: ClientProxy,
    @Inject('CASES_CLIENT') private readonly caseClient: ClientProxy,
    @Inject('CONTRACT_CLIENT') private readonly contractClient: ClientProxy,
    @Inject('OR_MANAGEMENT_CLIENT') private readonly orManagementClient: ClientProxy,
    @Inject('PATIENTS_ANAGRAPHICS_CLIENT') private readonly patientsClient: ClientProxy,
  ) {
    this.loggingService.setComponent(Component.UNIVERSAL_REPORTING)
  }

  configurations: Record<tSupportedQueriesCollections, {
    client: ClientProxy,
    pattern: { role: string, cmd: 'query' },
    data?: Partial<tExecuteQueryPayload>,
  }> = {
      materialsDatabase: {
        client: this.anagraphicsClient,
        ...QUERY_CONFIGURATIONS.materialsDatabase
      },

      users: {
        client: this.usersClient,
        ...QUERY_CONFIGURATIONS.users
      },

      cases: {
        client: this.caseClient,
        ...QUERY_CONFIGURATIONS.cases
      },

      contracts: {
        client: this.contractClient,
        ...QUERY_CONFIGURATIONS.contracts
      },

      doctorOpStandards: {
        client: this.contractClient,
        ...QUERY_CONFIGURATIONS.doctorOpStandards
      },

      anesthesiologistOpStandards: {
        client: this.contractClient,
        ...QUERY_CONFIGURATIONS.anesthesiologistOpStandards
      },

      orManagement: {
        client: this.orManagementClient,
        ...QUERY_CONFIGURATIONS.orManagement
      },

      patients: {
        client: this.patientsClient,
        ...QUERY_CONFIGURATIONS.patients
      },

      pricePointConfigs: {
        client: this.systemConfigurationClient,
        ...QUERY_CONFIGURATIONS.pricePointConfigs
      },

      generalData: {
        client: this.systemConfigurationClient,
        ...QUERY_CONFIGURATIONS.generalData
      },
    }

  async testEvaluateExpression (
    authorization: string,
    userPermissions: UserPermissions,
  ): Promise<tTestError[] | void> {
    let result
    try {
      type tTest = {
        data: tExpression
        scope: tScope
        selectedLocale: tSupportedLocales
        expected: tExpressionResult
        error?: boolean
        impure?: boolean
      }

      const errorStack: tTestError[] = []
      // Type is a mess here, but this function will be removed when implementing the complete tester
      const filesEntries = Object.entries(evaluateJSONs) as unknown as [string, tTest[]][]

      for (const [fileId, value] of filesEntries) {
        const testsEntries = Object.entries(value)
        for (const [testIndex, test] of testsEntries) {
          const parsedUserPermissions = (test.scope?.userPermissions as UserPermissions) ??
            userPermissions

          result = await this.evaluateExpression({
            data: test.data,
            scope: test.scope,
            selectedLocale: test.selectedLocale,
            userPermissions: parsedUserPermissions,
            authorization,
          })

          if (result.evaluated.error != null) {
            if (!test.error) {
              const parsedResult = { value: result.evaluated.error, ...getNewEmissions() }

              errorStack.push({
                fileId,
                testIndex,
                result: parsedResult,
                expected: test.expected,
                expectedError: false,
                impure: test.impure
              })
            }
          } else if (
            JSON.stringify(result.evaluated.value) !== JSON.stringify(test.expected) &&
            test.impure !== true
          ) {
            errorStack.push({
              fileId,
              testIndex,
              result: result.evaluated,
              expected: test.expected,
              expectedError: test.error,
              impure: test.impure
            })
          }
        }
      }
      return errorStack
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async executeQuery (
    data: tExecuteQueryData,
    userPermissions: UserPermissions | undefined
  ) {
    const configuration = this.configurations[data.collection!]
    if (!configuration) throw new Error(`Collection ${data.collection} not found!`)

    if (!data.__ignorePermissions && userPermissions == null)
      throw new Error('Permissions are required')

    const response = await callMSWithTimeoutAndRetry(
      configuration.client,
      configuration.pattern,
      { ...configuration.data, ...data, userPermissions },
      Component.UNIVERSAL_REPORTING,
    )

    return response
  }

  // XXX Warning: this skips all checks, so NEVER USE IT outside the dependencies
  // graph related bits
  // This function might seem just a "particular case" of the executeQuery, but
  // its not. Here is the difference:
  // We can evaluate deeply nested expressions, which can have a query at any
  // level of nesting. We call "evaluateExpression" at the top level, providing
  // all the evaluating helper functions (i.e. executeQUery, evaluateNamedExpressions)
  // which are then propagated to all the sublevels.
  // This is why we need this function: simply adding the ignorePermissions flag
  // at the top level is not enough, because that flag is not propagated down the
  // stream. We need a function that re-injects it at every query evaluation.
  executeQueryBypassDependencies = async (
    data: tExecuteQueryData,
  ) => {
    const configuration = this.configurations[data.collection!]
    if (!configuration) throw new Error(`Collection ${data.collection} not found!`)

    const payload = { ...configuration.data, ...data, __ignorePermissions: true }

    const response = await callMSWithTimeoutAndRetry(
      configuration.client,
      configuration.pattern,
      payload,
      Component.UNIVERSAL_REPORTING,
    )

    return response
  }

  async evaluateExpression ({
    data,
    scope,
    selectedLocale,
    userPermissions,
    authorization,
  }: {
    data: tExpression
    scope: tScope
    selectedLocale: tSupportedLocales
    userPermissions: UserPermissions | undefined
    authorization: string
  }): Promise<{ evaluated: tExpressionResult, error: IGenericError | null }> {
    try {
      const executeHttp: tExecuteHttp = getGenericExecuteHttp(authorization)

      const executeQueryFnc =
        async (data: tExecuteQueryData) => this.executeQuery(data, userPermissions)

      const evaluateNamedExpressionFnc = async (data: tEvaluateNamedExpressionData) =>
        this.evaluateNamedExpression(data, userPermissions, authorization)

      const result = await evaluateExpression({
        mainExpression: data,
        firstScope: {
          ...scope,
          self: {
            ...scope?.self,
            userPermissions,
          },
        },
        selectedLocale,
        executeQuery: executeQueryFnc,
        evaluateNamedExpression: evaluateNamedExpressionFnc,
        executeHttp,
      })

      return { evaluated: result, error: null }
    } catch (e: unknown) {
      await this.loggingService.throwErrorAndLog(e as IGenericError)
    }

    const result = { evaluated: { value: null, ...getNewEmissions() }, error: null }

    return result
  }

  async evaluateNamedExpression ({
    namedExpressionId,
    scope,
    selectedLocale,
  }: tEvaluateNamedExpressionData,
  userPermissions: UserPermissions | undefined,
  authorization: string) {
    const namedExpression = await this.namedExpressionModel.findById(namedExpressionId).lean()

    if (!namedExpression) throw new Error(`Named expression "${namedExpressionId}" not found!`)

    const result = await this.evaluateExpression({
      data: namedExpression.data,
      scope,
      selectedLocale,
      userPermissions,
      authorization,
    })
    return result.evaluated
  }
}
