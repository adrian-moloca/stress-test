import React from 'react'
import { useParams } from 'react-router'
import {
  useGetAnesthesiologistOPStandard,
  useGetAnesthesiologistOPStandardFormik,
  useGetAnesthesiologistOPStandardNearVersions,
} from 'hooks'
import { FormikProps } from 'formik'
import {
  AnesthesiologistOpStandard,
  AnesthesiologistOpStandardProcess,
  permissionRequests,
} from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useAppSelector } from 'store'
import { OpStandardManagementProvider } from 'components/materials/OpStandardContext'
import { isValid } from 'date-fns'
import MainPage from './components/MainPage'
import ForbiddenPage from 'pages/Forbidden'

const AnesthesiologistOPStandardManagement = ({ process }:
{ process: AnesthesiologistOpStandardProcess }) => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const { anesthesiologistopstandardId } = useParams()

  const [edit, isNew] = React.useMemo(
    () => [
      process !== AnesthesiologistOpStandardProcess.VIEW,
      process === AnesthesiologistOpStandardProcess.CREATE ||
      process === AnesthesiologistOpStandardProcess.NEW_VERSION,
    ],
    [process],
  )

  const form: FormikProps<AnesthesiologistOpStandard> = useGetAnesthesiologistOPStandardFormik()

  const anesthesiologistOpStandard = useGetAnesthesiologistOPStandard(anesthesiologistopstandardId)
  const checkPermission = useGetCheckPermission()
  const canCreateAnesthesiologistOpStandard = checkPermission(permissionRequests
    .canCreateAnesthesiologistOpStandard)
  const canViewAnesthesiologistOpStandard = checkPermission(permissionRequests
    .canViewAnesthesiologistOpStandard, {
    anesthesiologistOpStandard,
  })
  const canEditAnesthesiologistOpStandard =
    !anesthesiologistOpStandard ||
    checkPermission(permissionRequests.canEditAnesthesiologistOpStandard, {
      anesthesiologistOpStandard,
    })

  const nearVersions = useGetAnesthesiologistOPStandardNearVersions(
    anesthesiologistOpStandard?.anesthesiologistOpStandardId,
  )
  const hasNextVersion = nearVersions?.nextVersion != null

  React.useEffect(() => {
    if (
      form &&
      anesthesiologistOpStandard &&
      anesthesiologistOpStandard?.anesthesiologistOpStandardId === anesthesiologistopstandardId &&
      form.values.anesthesiologistOpStandardId !== anesthesiologistopstandardId
    )
      form.setValues(anesthesiologistOpStandard)
  }, [form, anesthesiologistOpStandard, anesthesiologistopstandardId])

  const date = React.useMemo(() =>
    isValid(new Date(form.values.validFrom)) && hasNextVersion
      ? new Date(form.values.validFrom)
      : new Date(), [form.values.validFrom, hasNextVersion])

  if (
    (process === AnesthesiologistOpStandardProcess.VIEW ||
          process === AnesthesiologistOpStandardProcess.EDIT) &&
        !canViewAnesthesiologistOpStandard
  )
    return <ForbiddenPage noRedirect />

  if (
    (process === AnesthesiologistOpStandardProcess.CREATE ||
          process === AnesthesiologistOpStandardProcess.NEW_VERSION) &&
        !canCreateAnesthesiologistOpStandard
  )
    return <ForbiddenPage noRedirect />

  if (process === AnesthesiologistOpStandardProcess.EDIT && !canEditAnesthesiologistOpStandard)
    return <ForbiddenPage noRedirect />

  return (
    <OpStandardManagementProvider
      date={date}
    >
      <MainPage
        process={process}
        form={form}
        edit={edit}
        isNew={isNew}
        isLoading={isLoading}
        anesthesiologistOpStandard={anesthesiologistOpStandard}
        nearVersions={nearVersions}
        canEditAnesthesiologistOpStandard={canEditAnesthesiologistOpStandard}
        anesthesiologistopstandardId={anesthesiologistopstandardId}
      />
    </OpStandardManagementProvider>
  )
}

export default AnesthesiologistOPStandardManagement
