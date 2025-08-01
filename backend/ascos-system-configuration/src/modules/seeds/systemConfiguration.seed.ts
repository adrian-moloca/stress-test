import {
  systemConfigurationSections,
  generalDataFields,
  TranslatorLanguages,
  CurrencySymbols,
} from '@smambu/lib.constantsjs'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Seeder } from 'nestjs-seeder'
import { SystemConfigurationDataDocument } from 'src/schemas/systemConfiguration.schema'

@Injectable()
export class SystemConfigurationSeeder implements Seeder {
  // BIG explanatory comment here!
  // SO: Big explanatory comment for whoever will open this file without any
  // proper introduction. Below there is a LONG list of *seemingly* unused vars.
  // These are NOT unused. They are (badly) referenced dinamically with this[section]
  // where section is the exact name of the variable. This name is stored in
  // a different enum (systemConfigurationSections) and there is NO ENFORCING of
  // this. So if you remove any of the variables below, and open the system config
  // page, a big error pops up. If you use a diffenrent variable name here compared
  // to what's in the said enum, again big error.
  // This could be quite easily be fixed. Also be aware of the same behaviour in
  // the systemconfiguration service
  constructor (
    @InjectModel(systemConfigurationSections.FILE_CONFIGS)
    private fileConfigs: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.PRICE_POINT_CONFIGS)
    private pricePointConfigs: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.SUBJECT_AREAS)
    private subjectAreas: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.CASE_NUMBERS_CONFIGS)
    private caseNumbersConfiguration: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.PATIENT_NUMBERS_CONFIGS)
    private patientNumbersConfiguration: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS)
    private debtorNumbersConfiguration: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.SUPPLIER_CODES)
    private supplierCodes: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.COUNT_CONTROL)
    private countControl: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.GENERAL_DATA)
    private generalData: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.ENVIRONMENT_CONFIG)
    private environmentConfigurations: Model<SystemConfigurationDataDocument>,
  ) { }

  async seed (): Promise<any> {
    try {
      const seedData = {
        [systemConfigurationSections.FILE_CONFIGS]: {
          numberUploadLimit: 0,
          sizeUploadLimit: 0,
        },
        [systemConfigurationSections.PRICE_POINT_CONFIGS]: {
          pricePoint: 0,
        },
        [systemConfigurationSections.SUBJECT_AREAS]: [],
        [systemConfigurationSections.CASE_NUMBERS_CONFIGS]: {},
        [systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS]: {},
        [systemConfigurationSections.PATIENT_NUMBERS_CONFIGS]: {},
        [systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS]: {},
        [systemConfigurationSections.SUPPLIER_CODES]: [],
        [systemConfigurationSections.COUNT_CONTROL]: [],
        [systemConfigurationSections.GENERAL_DATA]: generalDataFields.reduce(
          (acc, field) => ({ ...acc, [field.key]: '' }),
          {},
        ),
        [systemConfigurationSections.ENVIRONMENT_CONFIG]: {
          language: TranslatorLanguages.en,
          currency: CurrencySymbols.EUR
        },
      }

      // eslint-disable-next-line no-console
      console.log('SEEDING::', seedData)
      for (const section of Object.keys(seedData)) {
        const dataDocument = await this[section].findOne({ section })
        if (!dataDocument) {
          const newDataDocument = new this[section](seedData[section])
          await newDataDocument.save()
        }
      }
    } catch (e) {
      console.error('SEED ERROR::', e)
    }
  }

  async drop (): Promise<any> {
    for (const section of Object.keys(systemConfigurationSections))
      await this[section].deleteMany({})
  }
}
