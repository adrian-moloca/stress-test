import {
  anagraphicsTypes,
  awaitableTimer,
  dataGridTrueValues,
  defaultEditRow,
  defaultNewRow,
  EAnagraphicsGetStatus,
  formatNewVersion,
  getRandomUniqueId,
  getTabbedAnagraphicSetup,
  IAnagraphicRow,
  IAnagraphicSetup,
  IAnagraphicsGetRequest,
  IAnagraphicVersion,
  Medication,
  NewMaterial,
  permissionRequests,
  staticAnagraphicsSetups,
  SterileGoodUnits,
  tEvaluatedAnagraphicSetup,
} from '@smambu/lib.constants'
import { FormikProps, useFormik } from 'formik'
import translator from 'utilities/translator/translator'
import * as yup from 'yup'
import useCreateError from './useCreateError'
import Papa from 'papaparse'
import React, { useState } from 'react'
import useCall from './useCall'
import { AnagraphicsApi } from 'api/anagraphics.api'
import { useGetCheckPermission } from './userPermission'
import { GLOBAL_ACTION, MATERIALS_DATABASE_ACTION } from 'store/actions'
import { useDispatch } from 'react-redux'
import { addHours, isAfter, isBefore, isSameDay, isValid, startOfDay } from 'date-fns'
import { useAppSelector } from 'store'
import { useEvaluateExpression } from './urHooks/expressionHooks'

const activeCache = import.meta.env.VITE_DISABLE_ANAGRAPHICS_CACHE !== 'true'

const anagraphicsCache = {} as Record<string, Record<string, IAnagraphicVersion>>

// This is a workaround to add a custom method to yup array schema
declare module 'yup' {
  interface ArraySchema<
    TIn extends any[] | null | undefined = any,
    TContext extends object = object,
    TDefault = undefined,
    TFlags extends yup.Flags = '',
  > extends yup.Schema<TIn, TContext, TDefault, TFlags> {
    unique(keyFields: string[], message: string): ArraySchema<TIn, TContext, TDefault, TFlags>
  }
}

const invertedLanguageTab: Record<string, string[]> = Object.entries(translator.getLanguageTab())
  .reduce(
    (acc, [key, value]) => {
      acc[value] = [...(acc[value] ?? []), key]
      return acc
    },
    {} as Record<string, string[]>,
  )

const getSameKeysRow = (newRow: IAnagraphicRow,
  oldRows: IAnagraphicRow[],
  anagraphicSetup: IAnagraphicSetup) => {
  const keys = anagraphicSetup.fields?.filter?.(field => field.isKey)
  if (!keys.length) return null

  return oldRows.filter(oldRow => keys
    .every(key => newRow[key.name] === oldRow[key.name]))?.[0] ??
    null
}

const isRowUntouched = (newRow: IAnagraphicRow,
  oldRow: IAnagraphicRow,
  anagraphicSetup: IAnagraphicSetup) => {
  const fields = anagraphicSetup.fields?.filter?.(field => !field.noCSV)
  return fields.every(field => {
    let isSame = false
    if (field.type === 'date')
      isSame = ((newRow[field.name] || '') === (oldRow[field.name] || '')) ||
        (isValid(new Date(newRow[field.name] as string)) &&
          isValid(new Date(oldRow[field.name] as string)) &&
          isSameDay(
            new Date(newRow[field.name] as string), new Date(oldRow[field.name] as string)
          )
        )
    else if (field.type === 'boolean')
      isSame = dataGridTrueValues.includes(newRow[field.name] as string | number | boolean) ===
        dataGridTrueValues.includes(oldRow[field.name] as string | number | boolean)
    else if (field.type === 'string')
      isSame = (newRow[field.name] as string ?? '').trim() === (oldRow[field.name] as string ?? '').trim()
    else if (field.type === 'number' || field.type === 'price')
      isSame = (newRow[field.name] || 0) === (oldRow[field.name] || 0) ||
        (newRow[field.name] != null && oldRow[field.name] != null &&
          parseFloat(newRow[field.name] as string) === parseFloat(oldRow[field.name] as string))
    else
      isSame = newRow[field.name] === oldRow[field.name]

    return isSame
  })
}

// We need this method to check if a row is unique in the array of rows of a version
yup.addMethod(yup.array as any, 'unique', function (keyFields: string[], message: string) {
  return this.test('unique', message, function (array: any[]) {
    if (keyFields?.length === 0 || !array?.length) return true

    const getRowKeysValue = (row: any) => keyFields.map(keyField => row[keyField]).join(' ')

    const duplicates = array
      .map(row => getRowKeysValue(row))
      .reduce((acc, rowValue, index, array) => {
        if (rowValue && array.filter(value => value === rowValue).length > 1) acc.push(index)
        return acc
      }, [] as number[])

    return new yup.ValidationError(
      duplicates
        .map(index =>
          keyFields.map(keyField => new yup.ValidationError(message, array[index][keyField], `${index}.${keyField}`)))
        .flat(),
    )
  })
})

export const useGetAnagraphicsSetups = () => {
  const evaluateExpression = useEvaluateExpression()
  const userPermissions = useAppSelector(state => state.auth.permissions)
  const [anagraphicsSetups, setAnagraphicsSetups] =
    useState<Record<string, tEvaluatedAnagraphicSetup>>({})
  const dynamicAnagraphics = useAppSelector(state =>
    state.dynamicData.anagraphics)

  const hasPermissions = Object.keys(userPermissions).length > 0

  React.useEffect(() => {
    const parseAnagraphicsSetups = async () => {
      const fullAnagraphicsSetups = [
        ...staticAnagraphicsSetups,
        ...dynamicAnagraphics,
      ]

      const evaluatedAnagraphicsSetups =
        Object.fromEntries(await Promise.all(fullAnagraphicsSetups.map(async (value, index) => {
          const permissionRequestsPromises = Object.entries(value.permissionsRequests)
            .map(async ([key, value]) => {
              const result = await evaluateExpression(value)
              return [key, result.value]
            })

          const permissionsRequests = Object.fromEntries(
            await Promise.all(permissionRequestsPromises)
          )

          return [value.anagraphicType, {
            ...value,
            index,
            permissionsRequests,
          }]
        })))

      setAnagraphicsSetups(evaluatedAnagraphicsSetups)
    }

    if (hasPermissions) parseAnagraphicsSetups()
  }, [dynamicAnagraphics.length, hasPermissions])

  return anagraphicsSetups
}

export const useGetActiveVersion = () => {
  const call = useCall()

  const getCachedVersion = ({ anagraphicType, subType, date }: IAnagraphicsGetRequest) => {
    if (!anagraphicsCache[subType ?? anagraphicType]) return null

    return Object.values(anagraphicsCache[subType ?? anagraphicType]).find(
      version =>
        !isAfter(version.fromDate, date!) &&
       (!version.nextVersion ||
         !isBefore(version.nextVersion.fromDate, date!)),
    )
  }

  const getActiveVersion = ({ anagraphicType, subType, date }: IAnagraphicsGetRequest) => {
    return call(async function getVersion (): Promise<IAnagraphicVersion> {
      const cachedVersion = activeCache ? getCachedVersion({ anagraphicType, subType, date }) : null

      const response = await AnagraphicsApi.getActiveVersion({
        anagraphicType,
        subType,
        date,
        updatedAt: cachedVersion?.updatedAt,
        versionId: cachedVersion?._id,
      })

      if (cachedVersion != null && response.status === EAnagraphicsGetStatus.NO_CHANGES)
        return cachedVersion
      if (response?.data == null) throw new Error('anagraphics_version_not_found')

      const subTypeIndex = subType ?? anagraphicType
      if (activeCache) {
        if (!anagraphicsCache[subTypeIndex]) anagraphicsCache[subTypeIndex] = {}
        anagraphicsCache[subTypeIndex][response.data._id as string] = response.data
      }

      return response.data
    })
  }
  return { getActiveVersion }
}

export const useGetVersionById = () => {
  const call = useCall()

  const getVersionById = ({ anagraphicType, subType, versionId }: IAnagraphicsGetRequest,
    forceRefresh?: boolean) => {
    const subTypeIndex = subType ?? anagraphicType
    const cachedVersion = activeCache
      ? anagraphicsCache[subTypeIndex]?.[versionId!]
      : null

    return call(async function getVersion (): Promise<IAnagraphicVersion> {
      const response = await AnagraphicsApi.getVersion({
        anagraphicType,
        subType,
        versionId,
        updatedAt: cachedVersion?.updatedAt,
      })

      if (forceRefresh !== true &&
         cachedVersion != null &&
         response.status === EAnagraphicsGetStatus.NO_CHANGES)
        return cachedVersion
      if (response?.data == null) throw new Error('anagraphics_version_not_found')

      if (activeCache) {
        if (!anagraphicsCache[subTypeIndex]) anagraphicsCache[subTypeIndex] = {}
        anagraphicsCache[subTypeIndex][response.data._id as string] = response.data
      }

      return response.data
    })
  }
  return { getVersionById }
}

export const useGetMaterialsDatabaseVersion = (versionDate?: Date) => {
  const { getActiveVersion } = useGetActiveVersion()
  const date = React.useMemo(
    () => (!versionDate || !isValid(new Date(versionDate)) ? new Date() : new Date(versionDate!)),
    [versionDate],
  )
  const checkPermission = useGetCheckPermission()
  const canViewMaterialsDatabase = checkPermission(permissionRequests.canViewMaterialsDatabase)
  // eslint-disable-next-line max-len
  const canViewMaterialsDatabaseNames = checkPermission(permissionRequests.canViewMaterialsDatabaseNames)
  const dispatch = useDispatch()

  const materialsDatabaseVersion = useAppSelector(state =>
    state.materialsDatabase
      .sort((a, b) => isBefore(b.fromDate, a.fromDate) ? -1 : 1)
      .find(
        version =>
          isBefore(version.fromDate, date) &&
      (!version.nextVersion || isAfter(version.nextVersion.fromDate, date)),
      ))

  React.useEffect(() => {
    const getData = async () => {
      const res = await getActiveVersion({
        anagraphicType: anagraphicsTypes.MATERIALS_DATABASE,
        subType: anagraphicsTypes.MATERIALS_DATABASE,
        date,
      })

      if (res?.rows)
        dispatch({
          type: MATERIALS_DATABASE_ACTION.SET_VERSION,
          data: res,
        })
    }
    if (canViewMaterialsDatabase || canViewMaterialsDatabaseNames) getData()
  }, [date, canViewMaterialsDatabase, canViewMaterialsDatabaseNames])

  return materialsDatabaseVersion
}

export const useMaterials = (versionDate?: Date, onlySammelArticles?: boolean) => {
  const materialsDatabaseVersion = useGetMaterialsDatabaseVersion(versionDate)

  const materials = React.useMemo(
    () =>
      (materialsDatabaseVersion?.rows ?? [])
        .filter((row: IAnagraphicRow) => !onlySammelArticles || row.sprechstundenbedarf)
        .map((row: IAnagraphicRow) => ({
          id: row.artikelnummer,
          name: row.artikelbezeichnung || row.artikelnummer,
          code: row.artikelnummer,
          privatePrice: row.basicPricePerUnit_PrivateInsurance,
        })),
    [materialsDatabaseVersion],
  )

  return { materials: materials as NewMaterial[] }
}

export const useMedications = (versionDate?: Date) => {
  const materialsDatabaseVersion = useGetMaterialsDatabaseVersion(versionDate)

  const medications = React.useMemo(
    () =>
      (materialsDatabaseVersion?.rows ?? []).map((row: IAnagraphicRow) => ({
        medicationId: row.artikelnummer,
        name: row.artikelbezeichnung || row.artikelnummer,
        medicationCode: row.artikelnummer,
      })),
    [materialsDatabaseVersion],
  )

  return { medications: medications as Medication[] }
}

export const useGoaNumbers = (versionDate?: Date) => {
  const { getActiveVersion } = useGetActiveVersion()
  const [goaANumbers, setGoaANumbers] = React.useState<number[]>([])
  const [goaBNumbers, setGoaBNumbers] = React.useState<number[]>([])
  const checkPermission = useGetCheckPermission()
  const canViewGoa = checkPermission(permissionRequests.canViewGoa)

  React.useEffect(() => {
    const getGoaNumbersA = async () => {
      const date = !versionDate ||
      !isValid(new Date(versionDate))
        ? new Date()
        : new Date(versionDate!)
      const res = await getActiveVersion({
        anagraphicType: anagraphicsTypes.GOA,
        subType: anagraphicsTypes.GOACATA,
        date,
      })
      if (res?.rows) setGoaANumbers(res.rows.map((row: IAnagraphicRow) => row.number))
    }
    if (canViewGoa && !goaANumbers.length) getGoaNumbersA()
  }, [versionDate, canViewGoa])

  React.useEffect(() => {
    const getGoaNumbersB = async () => {
      const date = !versionDate ||
      !isValid(new Date(versionDate))
        ? new Date()
        : new Date(versionDate!)
      const res = await getActiveVersion({
        anagraphicType: anagraphicsTypes.GOA,
        subType: anagraphicsTypes.GOACATB,
        date,
      })
      if (res?.rows) setGoaBNumbers(res.rows.map((row: IAnagraphicRow) => row.number))
    }
    if (canViewGoa && !goaANumbers.length) getGoaNumbersB()
  }, [versionDate, canViewGoa])

  const goaNumbers = React.useMemo(() => [...goaANumbers, ...goaBNumbers],
    [goaANumbers, goaBNumbers])

  return { goaNumbers, goaANumbers, goaBNumbers }
}

export const useOPSnumbers = (versionDate?: Date) => {
  const { getActiveVersion } = useGetActiveVersion()
  const [OPSnumbers, setOPSnumbers] = React.useState<string[]>([])
  const checkPermission = useGetCheckPermission()
  const canViewOpsCatalogue = checkPermission(permissionRequests.canViewOpsCatalogue)

  React.useEffect(() => {
    const getOPSnumbers = async () => {
      const date = !versionDate ||
      !isValid(new Date(versionDate))
        ? new Date()
        : new Date(versionDate!)
      const res = await getActiveVersion({
        anagraphicType: anagraphicsTypes.OPSCATALOGUE,
        date,
      })
      if (res?.rows) setOPSnumbers(res.rows.map((row: IAnagraphicRow) => row.ops))
    }
    if (canViewOpsCatalogue && !OPSnumbers.length) getOPSnumbers()
  }, [versionDate, canViewOpsCatalogue])

  return { OPSnumbers }
}

export const useSterileGoods = (versionDate?: Date) => {
  const { getActiveVersion } = useGetActiveVersion()
  const [sterileGoods, setSterileGoods] =
    React.useState<Record<SterileGoodUnits, { id: string; label: string, key: string }[]>>({
      [SterileGoodUnits.SET]: [],
      [SterileGoodUnits.SINGLE_INSTRUMENT]: [],
      [SterileGoodUnits.CONTAINER]: [],
    })
  const checkPermission = useGetCheckPermission()
  const canViewSterileGoods = checkPermission(permissionRequests.canViewSterileGoods)
  const canViewSterileGoodNames = checkPermission(permissionRequests.canViewSterileGoodNames)

  React.useEffect(() => {
    const date = !versionDate ||
     !isValid(new Date(versionDate))
      ? new Date()
      : new Date(versionDate!)
    const getSterileGods = async () => {
      const sets = await getActiveVersion({
        anagraphicType: anagraphicsTypes.STERILEGOODS,
        subType: anagraphicsTypes.SETS,
        date,
      })
      const singleInstruments = await getActiveVersion({
        anagraphicType: anagraphicsTypes.STERILEGOODS,
        subType: anagraphicsTypes.EINZELINSTRUMENTE,
        date,
      })
      const containers = await getActiveVersion({
        anagraphicType: anagraphicsTypes.STERILEGOODS,
        subType: anagraphicsTypes.SIEBE,
        date,
      })

      const parseRow = (row: IAnagraphicRow) =>
        ({
          id: row.code,
          label: row.bezeichnung || `${row.code ?? ''}${row.seriennr ? ` - ${row.seriennr}` : ''}`,
          key: `${row.code ?? ''}${row.seriennr ? ` - ${row.seriennr}` : ''}`,
        } as { id: string; label: string })

      setSterileGoods({
        [SterileGoodUnits.SET]: (sets?.rows ?? []).map(parseRow),
        [SterileGoodUnits.SINGLE_INSTRUMENT]: (singleInstruments?.rows ?? []).map(parseRow),
        [SterileGoodUnits.CONTAINER]: (containers?.rows ?? []).map(parseRow),
      })
    }
    if ((canViewSterileGoods || canViewSterileGoodNames) &&
     !Object.values(sterileGoods).flat().length)
      getSterileGods()
  }, [versionDate, canViewSterileGoods, canViewSterileGoodNames])

  return { sterileGoods }
}

export const useGetAnagraphics = ({
  anagraphicType,
  anagraphicsSetups,
}: {
  anagraphicType: string
  anagraphicsSetups: Record<string, tEvaluatedAnagraphicSetup>
}) => {
  const dispatch = useDispatch()
  const call = useCall()
  const fullAnagraphicSetup = anagraphicsSetups[anagraphicType]
  const [selectedSubType, setSelectedSubType] = React.useState(fullAnagraphicSetup?.subTypes?.[0])
  const [version, setVersion] = React.useState<IAnagraphicVersion | undefined>()
  const [edit, setEdit] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')
  const { getActiveVersion: getActiveVersionFunction } = useGetActiveVersion()
  const { getVersionById } = useGetVersionById()

  const anagraphicSetup: IAnagraphicSetup = React.useMemo(
    () => getTabbedAnagraphicSetup(fullAnagraphicSetup!, selectedSubType),
    [fullAnagraphicSetup?.anagraphicType, fullAnagraphicSetup?.anagraphicType, selectedSubType],
  )

  const userPermissions = anagraphicSetup.permissionsRequests

  React.useEffect(() => {
    const checkTab = () => {
      if (!selectedSubType && anagraphicSetup.subTypes?.length)
        setSelectedSubType(anagraphicSetup.subTypes[0])
      else if (selectedSubType && !anagraphicSetup.subTypes?.length) setSelectedSubType(undefined)
      else if (selectedSubType && !anagraphicSetup.subTypes?.includes(selectedSubType))
        setSelectedSubType(anagraphicSetup.subTypes![0]!)
      else if (userPermissions.view) getData()
    }
    const getData = async () => {
      await form.setValues([])
      const version = await getActiveVersion()

      if (version.rows) form.setValues(version.rows)
    }
    checkTab()
  }, [userPermissions.view, anagraphicSetup, selectedSubType])

  const { form, getRowsWithDuplicateKeys, fieldKeys } = useAnagraphicsForm({ anagraphicSetup })

  const rowsWithDuplicateKeys = React.useMemo(
    () => getRowsWithDuplicateKeys(form.values),
    [getRowsWithDuplicateKeys, form.values],
  )

  const saveVersion = (
    newVersion: IAnagraphicVersion,
    saveToBackend?: boolean,
  ): IAnagraphicVersion | Promise<IAnagraphicVersion> => {
    const parsedVersion = newVersion.rows == null
      ? formatNewVersion()
      : {
        ...newVersion,
        fromDate: new Date(newVersion.fromDate),
      }

    if (saveToBackend) {
      return saveVersionToBackend(parsedVersion)
    } else {
      setVersion(parsedVersion)

      if (parsedVersion.rows) form.setValues(parsedVersion.rows)

      return newVersion
    }
  }

  const deleteVersion = () => {
    return call(async function deleteVersion () {
      if (!userPermissions.deleteVersion || !version) return

      const nextVersionId = version.previousVersion?._id || version.nextVersion?._id
      const response = await AnagraphicsApi.deleteVersion({
        anagraphicType,
        subType: selectedSubType,
        versionId: version!._id,
      })

      if (activeCache === true) {
        delete anagraphicsCache[selectedSubType ?? anagraphicType]?.[version._id!]

        const prevId = version?.previousVersion?._id
        if (prevId != null && anagraphicsCache[selectedSubType ?? anagraphicType]?.[prevId] != null)
          delete anagraphicsCache[selectedSubType ?? anagraphicType][prevId]

        const nextId = version?.nextVersion?._id
        if (nextId != null && anagraphicsCache[selectedSubType ?? anagraphicType]?.[nextId] != null)
          delete anagraphicsCache[selectedSubType ?? anagraphicType][nextId]
      }

      if (response && nextVersionId) getVersion(nextVersionId, true)
      setEdit(false)
    })
  }

  const getActiveVersion = async () => {
    return call(async function getActiveVersion () {
      const data = await getActiveVersionFunction({
        anagraphicType,
        subType: selectedSubType,
        updatedAt: new Date(),
      })
      if (data) {
        setEdit(false)
        return saveVersion(data)
      } else {
        const newVersion = formatNewVersion()
        setVersion(newVersion)
        return newVersion
      }
    })
  }

  const getVersion = async (versionId: string, forceRefresh?: boolean) => {
    return call(async function getVersion () {
      const data = await getVersionById({
        anagraphicType,
        subType: selectedSubType,
        versionId
      }, forceRefresh)
      if (data) {
        setVersion(data)
        form.setValues(data.rows)
        setEdit(false)
        return version
      } else {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            type: 'error',
            text: 'anagraphics_version_not_found',
          },
        })
      }
    })
  }

  const saveVersionToBackend = async (newVersion: IAnagraphicVersion) => {
    return call(async function saveAnagraphicsData () {
      const data = await AnagraphicsApi.editVersion({
        anagraphicType,
        subType: selectedSubType,
        version: {
          ...newVersion,
          fromDate: startOfDay(newVersion.fromDate),
        },
      })
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          type: 'success',
          text: 'anagraphics_save_success',
        },
      })
      return saveVersion(data!)
    })
  }

  const createNewVersion = async () => {
    if (!userPermissions.edit || !version) return

    const newVersion = formatNewVersion(version)

    setVersion(newVersion)
    form.setValues(newVersion.rows)
    setEdit(true)
  }

  const setFromDate = (fromDate: Date | null) => {
    if (!userPermissions.edit || !fromDate || !version) return

    const newVersion = { ...version }
    newVersion.fromDate = addHours(startOfDay(fromDate), 12)
    saveVersion(newVersion)
  }

  const addNewLine = () => {
    const newRow = {
      ...defaultNewRow(),
      id: form.values.length,
      key: getRandomUniqueId(),
    } as IAnagraphicRow

    form.setValues([...form.values, newRow])
  }

  const deleteNewLine = (rowKey: string) => {
    const oldLinesLength = version!.rows.length
    const newValues = form.values
      .filter(row => row.key !== rowKey)
      .map((row, index) => (index < oldLinesLength ? row : { ...row, id: index }))

    form.setValues(newValues)
  }

  const deleteAllRows = () => {
    form.setValues([])
  }

  const cancelEdit = async () => {
    dispatch({ type: GLOBAL_ACTION.START_LOADING, data: 'anagLoading' })
    await awaitableTimer(300)
    if (version?.new) {
      const newVersion = await getActiveVersion()
      await form.setValues(newVersion.rows)
    } else {
      await form.setValues(version!.rows!)
    }
    setEdit(false)
    dispatch({ type: GLOBAL_ACTION.STOP_LOADING, data: 'anagLoading' })
  }

  const onEdit = async ({ name, value, rowKey }: { name: string; value: any; rowKey: string }) => {
    dispatch({ type: GLOBAL_ACTION.START_LOADING, data: 'anagLoading' })
    await awaitableTimer(300)
    if (!userPermissions.edit) return

    const field = anagraphicSetup.fields.find(field => field.name === name)
    if (!field || field.readonly) return

    const id = form.values.findIndex(row => row.key === rowKey)
    const oldValues = form.values[id]
    const newValues = { [name]: value }
    const editedRow = {
      ...defaultEditRow(newValues, oldValues),
      id: oldValues.id,
      key: oldValues.key,
    }

    const newRows = [...form.values]
    newRows[id] = editedRow
    await form.setValues(newRows)
    dispatch({ type: GLOBAL_ACTION.STOP_LOADING, data: 'anagLoading' })
  }

  const onSave = async () => {
    let isNew = version?.new
    if (!userPermissions.edit) return

    const newVersion = { ...version! }
    newVersion.rows = form.values
    if (isNew === true) delete newVersion.new

    const response = await saveVersion(newVersion, true)
    if (!response._id) return

    setEdit(false)
    if (activeCache === true)
      anagraphicsCache[selectedSubType ?? anagraphicType][response._id] = response
    if (activeCache === true && isNew === true) {
      const prevId = response?.previousVersion?._id
      if (prevId != null && anagraphicsCache[selectedSubType ?? anagraphicType]?.[prevId])
        anagraphicsCache[selectedSubType ?? anagraphicType][prevId] = {
          ...anagraphicsCache[selectedSubType ?? anagraphicType][prevId],
          nextVersion: { ...response },
        }

      const nextId = response?.nextVersion?._id
      if (nextId != null && anagraphicsCache[selectedSubType ?? anagraphicType]?.[nextId])
        anagraphicsCache[selectedSubType ?? anagraphicType][nextId] = {
          ...anagraphicsCache[selectedSubType ?? anagraphicType][nextId],
          previousVersion: { ...response },
        }
    }
  }

  return {
    anagraphicSetup,
    userPermissions,
    selectedSubType,
    setSelectedSubType,
    version,
    getVersion,
    createNewVersion,
    deleteVersion,
    setFromDate,
    addNewLine,
    deleteNewLine,
    deleteAllRows,
    cancelEdit,
    onSave,
    onEdit,
    edit,
    setEdit,
    searchText,
    setSearchText,
    form,
    rowsWithDuplicateKeys,
    fieldKeys,
  }
}

export const useAnagraphicsForm = ({ anagraphicSetup }: { anagraphicSetup: IAnagraphicSetup }) => {
  const onSubmit = () => {}

  const yupSchema =
    (anagraphicSetup.fields ?? []).reduce?.((acc, field) => {
      switch (field.type) {
        case 'string':
          acc[field.name] = yup.string().typeError('anagraphics_string_error')
          break
        case 'number':
        case 'price':
          acc[field.name] = yup.number().typeError('anagraphics_number_error')
          break
        case 'date':
          acc[field.name] = yup.date().typeError('anagraphics_date_error')
          break
        case 'address':
          acc[field.name] = yup.object().shape({
            street: yup.string().typeError('anagraphics_string_error'),
            streetNumber: yup.string().typeError('anagraphics_string_error'),
            city: yup.string().typeError('anagraphics_string_error'),
            postalCode: yup.string().typeError('anagraphics_string_error'),
            country: yup.string().typeError('anagraphics_string_error'),
          })
          break
        case 'boolean':
          acc[field.name] = yup.boolean().typeError('anagraphics_boolean_error')
          break
        default:
          console.error(`Field type "${field.type}" not supported`)
          break
      }
      if (field.required) acc[field.name] = acc[field.name].required('anagraphics_required_error')
      return acc
    }, {} as any) ?? {}

  const fieldKeys = anagraphicSetup.fields?.filter?.(field => field.isKey).map(field => field.name)

  const getRowsWithDuplicateKeys = React.useCallback(
    (rows: IAnagraphicRow[]) => {
      if (!fieldKeys?.length) return []
      const keys = {} as Record<string, string>
      const duplicates = [] as string[]
      for (let row of rows) {
        const fieldKey = fieldKeys.map(key => row[key]).join(' ')
        if (keys[fieldKey])
          if (duplicates.includes(keys[fieldKey])) duplicates.push(row.key)
          else duplicates.push(keys[fieldKey], row.key)
        else keys[fieldKey] = row.key
      }
      return duplicates
    },
    [fieldKeys],
  )

  const form = useFormik({
    initialValues: [] as IAnagraphicRow[],
    validationSchema: yup.array().of(yup.object().shape(yupSchema)),
    onSubmit,
  })

  return { form, getRowsWithDuplicateKeys, fieldKeys }
}

export const useCSVForm = ({
  anagraphicSetup,
  versionForm,
}: {
  anagraphicSetup: IAnagraphicSetup
  versionForm: FormikProps<IAnagraphicRow[]>
}) => {
  const call = useCall()
  const [showModal, setShowModal] = React.useState(false)
  const createError = useCreateError()
  const {
    form: csvForm,
    getRowsWithDuplicateKeys,
    fieldKeys
  } = useAnagraphicsForm({ anagraphicSetup })
  const showTable = Boolean(csvForm.values?.length)

  const csvRowsWithDuplicateKeys = React.useMemo(
    () => getRowsWithDuplicateKeys(csvForm.values),
    [getRowsWithDuplicateKeys, csvForm.values],
  )

  const emptyTable = () => csvForm.setValues([])

  const onEdit = ({ name, value, rowKey }: { name: string; value: any; rowKey: string }) => {
    const rowId = csvForm.values.findIndex(row => row.key === rowKey)
    csvForm.setFieldValue(`${rowId}.${name}`, value)
  }

  /* Unfortunatly, the CSV file doesn't have the same fields as the anagraphic setup,
  because the DataGrid export use the transated columns names,
  so we need to parse the file and map the fields to the correct ones */
  const parseRow = (row: IAnagraphicRow) =>
    Object.entries(row).reduce((acc, [key, value]) => {
      const fieldNames = (invertedLanguageTab[key.replaceAll('*', '')] ?? []).map((fieldName: string) =>
        fieldName.replace('anagraphics_', '').replace('_name', ''))
      if (!fieldNames.length) return acc
      const field = anagraphicSetup.fields
        .find(field => fieldNames
          .some(fieldName => fieldName === field.name))
      if (!field || field.noCSV) return acc

      let fieldValue
      switch (field.type) {
        case 'boolean':
          fieldValue = dataGridTrueValues.includes(value as string | number)
          break

        case 'date':
          fieldValue = isValid(new Date(value as string))
            ? new Date(value as string)
            : ''
          break

        default:
          fieldValue = value
          break
      }
      return {
        ...acc,
        [field.name]: fieldValue
      }
    }, {} as IAnagraphicRow)

  const handleFile = (file: File) => call(async function handleFile () {
    if (file?.type !== 'text/csv') return createError({ message: 'anagraphics_uploadCSVfileNoCSV_error' })
    const parseFile = async (file: File) => new Promise(resolve => {
      Papa.parse(file, {
        header: true,
        complete: (results: any) => resolve(results),
      })
    })
    const results: any = await parseFile(file)

    if (results.errors.length) {
      console.error(results.errors) // This is needed
      createError({
        message: 'anagraphics_uploadCSV_error',
        description: results.errors.map((error: any) => error.message).join('\n'),
      })
    }
    const values = results.data.map((row: any, index: number) => ({
      ...parseRow(row),
      id: index,
      key: getRandomUniqueId(),
    }))
    csvForm.setValues(values)
  })

  const results = csvForm.values.reduce(
    (acc, row) => {
      const sameKeysRow = getSameKeysRow(row, versionForm.values, anagraphicSetup)
      if (csvRowsWithDuplicateKeys.includes(row.key) || csvForm.errors[row.id])
        acc.invalid.push(row.id)
      else if (!sameKeysRow) acc.new.push(row.id)
      else if (isRowUntouched(row, sameKeysRow, anagraphicSetup)) acc.untouched.push(row.id)
      else acc.updated.push(row.id)
      return acc
    },
    {
      new: [] as number[],
      updated: [] as number[],
      untouched: [] as number[],
      invalid: [] as number[]
    },
  )

  const onConfirm = () => {
    const mergedRows = [
      ...versionForm.values.map(row => {
        const sameKeysRow = getSameKeysRow(row, csvForm.values, anagraphicSetup)
        if (sameKeysRow && results.updated.includes(sameKeysRow?.id))
          return defaultEditRow(sameKeysRow, row)
        else return row
      }),
      ...csvForm.values
        .filter(row => results.new.includes(row.id))
        .map(row => defaultNewRow(row)),
    ].map((row, index) => ({ ...row, id: index, key: row.key ?? getRandomUniqueId() }))

    versionForm.setValues(mergedRows)
    emptyTable()
    setShowModal(false)
  }

  return {
    csvForm: csvForm as unknown as FormikProps<IAnagraphicRow[]>,
    csvKeys: Object.keys(csvForm.values?.[0] ?? {}),
    showTable,
    emptyTable,
    handleFile,
    results,
    onConfirm,
    showModal,
    setShowModal,
    onEdit,
    csvRowsWithDuplicateKeys,
    fieldKeys,
  }
}
