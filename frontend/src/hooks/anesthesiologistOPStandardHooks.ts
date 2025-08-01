import {
  AnesthesiologicalService,
  AnesthesiologistOpStandard,
  AnesthesiologistOpStandardQueryKeys,
  CreateAnesthesiologistOpStandardDto,
  Identifier,
  Measures,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardPosition_Name,
  permissionRequests,
  PreExistingCondition,
  ToastType,
  UpdateAnesthesiologistOpStandardDto,
} from '@smambu/lib.constants'
import React, { useEffect, useState } from 'react'
import useCall from './useCall'
import { useCheckPermission, useGetCheckPermission } from './userPermission'
import { AnesthesiologistOPStandardApi } from '../api/anesthesiologistOPStandard.api'
import { FormikProps, useFormik } from 'formik'
import { formatAnesthesiologistOPStandardForm } from 'pages/AnesthesiologistOpStandard/formatter'
import { trlb } from 'utilities'
import * as yup from 'yup'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'
import { useNavigate } from 'react-router-dom'
import { routes } from 'routes/routes'
import { isValid, parse } from 'date-fns'

export const useGetAnesthesiologistOPStandards = (
  search: string,
  page: number,
  limit: number,
  sortBy: AnesthesiologistOpStandardQueryKeys,
  sortOrder: 'desc' | 'asc',
) => {
  const call = useCall()
  // eslint-disable-next-line max-len
  const canViewAnesthesiologistOpStandards = useCheckPermission(permissionRequests.canViewAnesthesiologistOpStandards)

  const [list, setList] = React.useState<{
    results: AnesthesiologistOpStandard[]
    total: number
    currentPage: number
    limit: number
  }>()

  React.useEffect(() => {
    if (!canViewAnesthesiologistOpStandards) return

    const controller: AbortController = new AbortController()

    call(async function getAnesthesiologistOpStandards () {
      const validDate = (search?.split(' ') ?? [])
        .filter(Boolean)
        .filter(word => isValid(parse(word, trlb('dateTime_date_string'), new Date())))
        .map(word => parse(word, trlb('dateTime_date_string'), new Date()))?.[0]

      const res = await AnesthesiologistOPStandardApi.getAnesthesiologistOPStandards(
        {
          search,
          validFrom: validDate ? new Date(validDate) : undefined,
          limit,
          page,
          sortBy,
          sortOrder,
        },
        controller,
      )
      setList(res)
    })
    return () => {
      controller.abort()
    }
  }, [search, canViewAnesthesiologistOpStandards, limit, page, sortBy, sortOrder])
  return list
}

export const useCreateAnesthesiologistOpStandard = () => {
  const call = useCall()
  const dispatch = useDispatch()
  // eslint-disable-next-line max-len
  const canCreateAnesthesiologistOpStandard = useCheckPermission(permissionRequests.canCreateAnesthesiologistOpStandard)
  const navigate = useNavigate()

  return (data: CreateAnesthesiologistOpStandardDto) =>
    call(async () => {
      if (canCreateAnesthesiologistOpStandard) {
        await AnesthesiologistOPStandardApi.createAnesthesiologistOPStandard(data)
      } else {
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            text: 'common_no_permission',
            type: ToastType.error,
          },
        })
        return
      }

      navigate(routes.anesthesiologistOPStandardList)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'anesthesiologistOPStandard_created_success',
          type: ToastType.success,
        },
      })
    })
}

export const useCreateNewVersionAnesthesiologistOpStandard = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (data: CreateAnesthesiologistOpStandardDto, id: Identifier) =>
    call(async () => {
      await AnesthesiologistOPStandardApi.createAnesthesiologistOPStandardVersion(data, id)

      navigate(routes.anesthesiologistOPStandardList)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'anesthesiologistOPStandard_created_success',
          type: ToastType.success,
        },
      })
    })
}

export const useUpdateAnesthesiologistOpStandard = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (id: string, data: UpdateAnesthesiologistOpStandardDto) =>
    call(async () => {
      await AnesthesiologistOPStandardApi.updateAnesthesiologistOPStandard(id, data)

      navigate(routes.anesthesiologistOPStandardList)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'anesthesiologistOPStandard_updated_success',
          type: ToastType.success,
        },
      })
    })
}

export const useDeleteAnesthesiologistOpStandard = () => {
  const call = useCall()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (id: string) =>
    call(async () => {
      await AnesthesiologistOPStandardApi.deleteAnesthesiologistOPStandard(id)

      navigate(routes.anesthesiologistOPStandardList)
      dispatch({
        type: GLOBAL_ACTION.ADD_TOAST,
        data: {
          text: 'anesthesiologistOPStandard_deleted_success',
          type: ToastType.success,
        },
      })
    })
}

export const useGetAnesthesiologistOPStandard = (id?: string):
AnesthesiologistOpStandard | undefined => {
  const [anesthesiologistOpStandard, setAnesthesiologistOpStandard] = React
    .useState<AnesthesiologistOpStandard>()
  const call = useCall()

  React.useEffect(() => {
    if (id)
      call(async function getAnesthesiologistOPStandardById () {
        const res = await AnesthesiologistOPStandardApi.getAnesthesiologistOPStandardById(id)
        if (res.anesthesiologistOpStandardId) setAnesthesiologistOpStandard(res)
        else setAnesthesiologistOpStandard(undefined)
      }, false)
  }, [id])

  return anesthesiologistOpStandard
}

export const useGetAnesthesiologistOPStandardFunction = () => {
  const call = useCall()

  const getAnesthesiologistOPS = (id: string) =>
    call(async function getAnesthesiologistOPStandardById () {
      const res = await AnesthesiologistOPStandardApi.getAnesthesiologistOPStandardById(id)
      return res
    })

  return getAnesthesiologistOPS
}

export const useGetAnesthesiologistOPStandardNearVersions = (id?: string) => {
  const call = useCall()

  const [result, setResult] = React.useState<{
    nextVersion?: AnesthesiologistOpStandard
    previousVersion?: AnesthesiologistOpStandard
  }>({
    nextVersion: undefined,
    previousVersion: undefined,
  })

  const fetchVersion = async (id: Identifier) => {
    const result = await call(async function getAnesthesiologistOPStandardNewVersion () {
      const res = await AnesthesiologistOPStandardApi.getNearAnesthesiologistOPStandardVersions(id)
      return res
    })
    setResult(result)
  }

  React.useEffect(() => {
    if (id) fetchVersion(id)
    else setResult({ nextVersion: undefined, previousVersion: undefined })
  }, [id])

  return result
}

export const useGetAnesthesiologistOPStandardFormik = ():
FormikProps<AnesthesiologistOpStandard> => {
  // i removed the yup.Schema<blabla> because i am currently unable to validate empty string in
  // required/defined fields. example:
  // OPstandarMaterial has specified note: string <- in yup this translates in a mandatory field.
  // mandatory fields are represented as yup.bla().required(trlb('commons_required')) or yup.bla().defined()
  // yup.type().required(trlb('commons_required')) doesn't validate empty string while yup.type().defined() should but it's not working atm.

  const opStandardMaterialValidation = yup // : yup.Schema<OpStandardMaterial> = yup
    .object<OpStandardMaterial>()
    .shape({
      amount: yup.number().min(0, trlb('commons_min0'))
        .required(trlb('commons_required')),
      prefill: yup.boolean().required(trlb('commons_required')),
      notes: yup.string(),
      materialId: yup.mixed<Identifier>().required(trlb('commons_required')),
    })

  const opStandardMedicationValidation = yup // : yup.Schema<OpStandardMedication> = yup
    .object<OpStandardMedication>()
    .shape({
      medicationId: yup.mixed<Identifier>().required(trlb('commons_required')),
      amount: yup.number().min(0, trlb('commons_min0'))
        .required(trlb('commons_required')),
      units: yup.string(),
      prefill: yup.boolean().required(trlb('commons_required')),
      notes: yup.string(),
    })

  const validation = // : yup.ObjectSchema<Omit<AnesthesiologistOpStandard, 'anesthesiologistOpStandardId'>> =
    yup.object<AnesthesiologistOpStandard>().shape({
      name: yup.string().required(trlb('commons_required'))
        .defined(),
      validFrom: yup.date().required(trlb('commons_required'))
        .typeError(trlb('commons_invalid_date'))
        .defined(),
      preExistingConditions: yup
        .array()
        .of(
          yup
            .mixed<PreExistingCondition>()
            .oneOf(Object.values(PreExistingCondition))
            .required(trlb('commons_required')),
        )
        .defined()
        .required(trlb('commons_required')),
      interoperativeMeasure: yup
        .array()
        .of(yup.mixed<Measures>().oneOf(Object.values(Measures))
          .required(trlb('commons_required')))
        .defined(),
      materials: yup.array().of(opStandardMaterialValidation)
        .required(trlb('commons_required')),
      medications: yup.array().of(opStandardMedicationValidation)
        .required(trlb('commons_required')),
      ventilationMaterials: yup.array().of(opStandardMaterialValidation)
        .required(trlb('commons_required')),
      positions: yup
        .array()
        .of(
          yup
            .mixed<OpStandardPosition_Name>()
            .oneOf(Object.values(OpStandardPosition_Name))
            .required(trlb('commons_required')),
        )
        .defined(),
      requiredServices: yup
        .array()
        .of(
          yup
            .mixed<AnesthesiologicalService>()
            .oneOf(Object.values(AnesthesiologicalService))
            .required(trlb('commons_required')),
        )
        .defined(),
    })

  return useFormik<AnesthesiologistOpStandard>({
    validateOnMount: true,
    initialValues: formatAnesthesiologistOPStandardForm(),
    validationSchema: validation,
    onSubmit: async (values, _actions) => {
      // eslint-disable-next-line no-console
      console.log(values)
    },
  })
}

export const useGetAnesthesiologistOPStandardsNames = () => {
  const checkPermission = useGetCheckPermission()
  const canViewAnesthesiologistOpStandards = checkPermission(permissionRequests
    .canViewAnesthesiologistOpStandards)
  const [opstandardNames, setOpstandardNames] = useState([])

  useEffect(() => {
    const getData = async () => {
      const res = await AnesthesiologistOPStandardApi.getNames()
      setOpstandardNames(res)
    }
    if (canViewAnesthesiologistOpStandards) getData()
  }, [canViewAnesthesiologistOpStandards])
  return opstandardNames
}
