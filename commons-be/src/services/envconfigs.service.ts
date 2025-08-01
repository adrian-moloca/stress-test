import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { Component, TranslatorLanguages, callMSWithTimeoutAndRetry } from '@smambu/lib.constantsjs'
import Translator from '@smambu/lib.constantsjs/lib/translator'
import { LoggingService } from './logging.service'

@Injectable()
export class EnvConfigsService {
  constructor (
    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,
    private readonly loggingService: LoggingService,
  ) { }

  async getTranslator (desiredLanguage?: string): Promise<Translator> {
    try {
      let language
      if (desiredLanguage !== '' && desiredLanguage != null) {
        switch (desiredLanguage) {
          case TranslatorLanguages.en:
            language = TranslatorLanguages.en
            break

          case TranslatorLanguages.de:
            language = TranslatorLanguages.de
            break

          default:
            language = TranslatorLanguages.en
            break
        }
      } else {
        const pattern = { role: 'environmentConfig', cmd: 'getLanguage' }

        language = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
          pattern,
          {},
          Component.COMMONS_BE)
      }
      const translator = new Translator(language)

      return translator
    } catch (e: any) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAppCurrency (): Promise<string | undefined> {
    try {
      const pattern = { role: 'environmentConfig', cmd: 'getCurrency' }

      const currency = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        {},
        Component.COMMONS_BE)

      return currency
    } catch (e: any) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
