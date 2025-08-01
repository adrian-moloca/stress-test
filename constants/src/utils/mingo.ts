import mingo from 'mingo'
import { IAnagraphicRow } from '../types'
import { AnyObject, Document, RootFilterQuery } from 'mongoose'

export const mingoFilterArray = (data: IAnagraphicRow[], query: RootFilterQuery<Document>) => {
  try {
    const filter = new mingo.Query(query as AnyObject)

    const result = filter.find(data).all()

    return result
  } catch (e) {
    console.error(e)
    throw e
  }
}

export const testQueryOnObject = (data: Record<string, unknown>,
  query:RootFilterQuery<Document>) => {
  try {
    const mingoQuery = new mingo.Query(query as AnyObject)

    const result = mingoQuery.test(data)

    return result
  } catch (e) {
    console.error(e)
    throw e
  }
}
