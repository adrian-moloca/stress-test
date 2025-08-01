import { Page } from '@playwright/test'
import { AnagraphicsPage } from './abstract/anagraphics.page'

const materialsDbColumns = {
  articleNumber: { label: /Artikelnummer/i, options: { unique: true } },
  description: { label: /Artikelbezeichnung/i },
  publicPrice: { label: /Basispreis je Grundeinheit - Public/i },
  privatePrice: { label: /Basispreis je Grundeinheit - Private/i }
}

export class MaterialsDbPage extends AnagraphicsPage<typeof materialsDbColumns> {
  constructor (page: Page, baseURL: string = 'http://localhost:3000') {
    super(
      page,
      baseURL,
      '/materialsDatabase',
      /Material database/i,
      materialsDbColumns,
    )
  }
}
