import { InsurancesPage } from '../pages/insurances.page'
import { MaterialsDbPage } from '../pages/materials_db.page'

export type AbstractColumns = {
  [key: string]: {label: RegExp | string, options?: {unique?: boolean}}
}

export interface SampleData {
  [key: string]: string
}

export interface MaterialsDbSampleData extends SampleData {
  articleNumber: string
  description: string
  publicPrice: string
  privatePrice: string
}

export interface InsurancesSampleData extends SampleData {
  number: string
  name: string
}

export interface MaterialsDbFixtureProps {
  mdbPage: MaterialsDbPage
  data: MaterialsDbSampleData
}

export interface InsurancesFixtureProps {
  insurancesPage: InsurancesPage
  data: InsurancesSampleData
}
