import React from 'react'
import { useGetCheckPermission } from 'hooks/userPermission'
import {
  IUser,
  MaterialUsageItem,
  filtersSections,
  getFullName,
  permissionRequests,
} from '@smambu/lib.constants'
import { Alert, Box, IconButton } from '@mui/material'
import { FlexAutocomplete, FlexDataTable } from 'components/FlexCommons'
import { trlb } from 'utilities'
import { useGetDoctors } from 'hooks/userHooks'
import { useReduxFilters } from 'hooks/filterHooks'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useAppSelector } from 'store'
import { columnDefs, getColumns } from '../components/PrescribableMaterialsColumns'
import { GridDateSelector } from 'components/Commons'
import { useGetPrescriptionsPcMaterials } from 'hooks/pcMaterialsHooks'

const dateString = trlb('dateTime_date_string')

const PrescribableMaterialsTab: React.FC = () => {
  const checkPermission = useGetCheckPermission()
  const contracts = useAppSelector(state => state.contracts)
  const canViewDoctors = checkPermission(permissionRequests.canViewDoctors)

  const {
    selectedDoctorId,
    setSelectedDoctorId,
    endDate,
    setEndDate,
  } = useReduxFilters<filtersSections.CASES_MATERIALS>(filtersSections.CASES_MATERIALS)

  const [refresh, setRefresh] = React.useState(false)
  const [doctors, setDoctors] = React.useState<IUser[]>([])
  const getDoctors = useGetDoctors()

  React.useEffect(() => {
    getDoctors().then(docz => {
      if (docz) setDoctors(docz)
      else setDoctors([])
    })
  }, [refresh, canViewDoctors])

  const selectedDoctor = doctors.find(doctor => doctor.id === selectedDoctorId)
  const selectedDoctorOption = selectedDoctorId && selectedDoctor
    ? {
      value: selectedDoctorId,
      label: getFullName(selectedDoctor, true) ?? ''
    }
    : undefined

  const {
    items,
  } = useGetPrescriptionsPcMaterials(
    selectedDoctorId,
    endDate,
    refresh
  )

  const refColumns = Object.values(columnDefs)
  const columns = getColumns(checkPermission)

  const formatItem = (item: MaterialUsageItem) => {
    let value = refColumns.reduce((acc, column) => {
      const translatedFallback = column.translated
        ? trlb(String(item[column.field as keyof MaterialUsageItem]))
        : item[column.field as keyof MaterialUsageItem] ?? ''

      const value = column.valueGetter?.(item, { dateString, contracts }) ?? translatedFallback

      acc[column.field] = value
      acc.id = item.id
      return acc
    }, {} as Record<string, any>)

    return value
  }

  const handleChangeDateRange = (end: Date | null) => {
    setEndDate(end)
  }

  const refreshDoctorData = () => {
    setRefresh(!refresh)
  }

  return (
    <>
      {doctors.length
        ? (
          <>
            <Box sx={{ display: 'flex', width: 1, gap: 1, mb: 1, alignItems: 'center', height: 50 }}>
              <IconButton onClick={refreshDoctorData}>
                <RefreshIcon />
              </IconButton>
              <FlexAutocomplete
                label={trlb('doctorFilterLabel')}
                options={Object.values(doctors).map(current => ({
                  value: current.id,
                  label: getFullName(current, true) as string,
                }))}
                onSelectValue={(_e, v) => setSelectedDoctorId(v?.value ?? '') }
                selected={selectedDoctorOption}
                sx={{ flexBasis: 0, flexGrow: 1 }}
              />

              <GridDateSelector xs={4}
                value={endDate}
                onChange={handleChangeDateRange}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', width: 1 }}>
              <FlexDataTable
                rows={Object.values(items).filter(item => !!item)
                  .map(formatItem)}
                columns={columns}
                autoHeight
              />
            </Box>
          </>
        )
        : null}
      {!canViewDoctors && <Alert severity='warning'>{trlb('no_view_Doctor_Permissions')}</Alert>}
    </>
  )
}

export default PrescribableMaterialsTab
