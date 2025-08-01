import { InsuranceEntry } from '@smambu/lib.constants'
import { Add, Close } from '@mui/icons-material'
import { Box, Modal, Paper } from '@mui/material'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { CloseButton, SaveButton, TextIconButton } from 'components/Buttons'
import { PageHeader, Space20 } from 'components/Commons'
import { FlexAutocomplete, FlexDataTable } from 'components/FlexCommons'
import React, { useState } from 'react'
import { trlb } from 'utilities'

interface InsurancesPopoverProps {
  showInsurancesPopover: boolean
  setShowInsurancesPopover: React.Dispatch<React.SetStateAction<boolean>>
  edit?: boolean
  insurances: Record<string, string>
  insurancesList: InsuranceEntry[]
  setInsurancesList: (prevState: InsuranceEntry[]) => void
}

const InsurancesPopover: React.FC<InsurancesPopoverProps> = ({
  showInsurancesPopover,
  setShowInsurancesPopover,
  edit,
  insurances,
  insurancesList,
  setInsurancesList,
}) => {
  const [selectionModel, setSelectionModel] = React.useState('')
  // eslint-disable-next-line max-len
  const [tempInsurancesList, setTempInsurancesList] = useState<{ nummer: null | string }[]>(insurancesList)

  const insurancesValues = Object.entries(insurances).map(el => ({
    value: el[0],
    label: `${el[0]} - ${el[1]}`,
  }))

  const getAvailableInsurances = (tempInsuranceNummer?: string) =>
    insurancesValues?.filter(
      i => !tempInsurancesList.some(t => t.nummer === i.value) || i.value === tempInsuranceNummer,
    )

  const rowsDict = tempInsurancesList.reduce(
    (acc, curr, index) => ({
      ...acc,
      [`${index}/${tempInsurancesList.length}`]: { ...curr, index, key: `${index}/${tempInsurancesList.length}` },
    }),
    {} as Record<string, any>,
  )
  const rows = Object.values(rowsDict)

  const columns = [
    {
      field: 'nummer',
      headerName: trlb('insurancesPopover_label'),
      flex: 1,
      renderCell: (params: any) => {
        return (
          <Box onClick={e => e.stopPropagation()} sx={{ width: '100%', display: 'flex' }}>
            <FlexAutocomplete
              options={getAvailableInsurances(params.row.nummer)}
              selected={insurancesValues?.find(i => i.value === params.row.nummer)}
              onSelectValue={(e, value) => {
                e.stopPropagation()
                if (value === null) return

                const tmp = tempInsurancesList
                  .map((i, idx) => (idx === params.row.index ? { nummer: value.value } : i))

                setTempInsurancesList(tmp)
              }}
              onKeyDown={e => e.stopPropagation()}
              disabled={!edit}
              textProps={{
                variant: 'standard',
              }}
            />
          </Box>
        )
      },
    },
  ]

  const addRow = () => {
    setTempInsurancesList([...tempInsurancesList, { nummer: null }])
  }

  const deleteRow = (selectionModel: string[]) => {
    const selectedIndexes = selectionModel.map(key => rowsDict[key].index)
    const newInsurancesList = tempInsurancesList
      .filter((_el, index) => !selectedIndexes.includes(index))
    setTempInsurancesList(newInsurancesList)
    setSelectionModel('')
  }

  const error = tempInsurancesList.some(i => i.nummer === null)

  return (
    <Modal
      open={showInsurancesPopover}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClose={() => setShowInsurancesPopover(false)}
    >
      <Paper
        style={{
          minHeight: '45%',
          width: '70%',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PageHeader pageTitle={trlb('insurancesPopover_title')}>
          <CloseButton onClick={() => setShowInsurancesPopover(false)} />
        </PageHeader>
        <Space20 />
        <FlexDataTable
          columns={columns}
          rows={rows}
          getRowId={(row: any) => row.key}
          autoHeight
          checkboxSelection={edit}
          components={{ Toolbar: CustomToolbar }}
          componentsProps={{
            toolbar: { selectionModel, addRow, deleteRow, edit },
          }}
          selectionModel={selectionModel}
          onSelectionModelChange={(newSelectionModel: any) => {
            setSelectionModel(newSelectionModel)
          }}
        />
        <Space20 />
        {edit && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <SaveButton
              disabled={error}
              onClick={() => {
                setInsurancesList(tempInsurancesList
                  .filter(i => i.nummer !== null) as InsuranceEntry[])
                setShowInsurancesPopover(false)
              }}
            />
          </Box>
        )}
      </Paper>
    </Modal>
  )
}

const CustomToolbar = ({
  selectionModel,
  addRow,
  deleteRow,
  edit,
}: {
  selectionModel: any
  addRow: () => void
  deleteRow: (selectionModel: any) => void
  edit?: boolean
}) => {
  return (
    <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey' }}>
      {edit && selectionModel.length > 0 && deleteRow
        ? (
          <TextIconButton
            onClick={() => deleteRow(selectionModel)}
            text={trlb('insurancesPopover_deleteRow')}
            icon={<Close sx={{ marginRight: '5px' }} />}
          />
        )
        : null}
      {edit && selectionModel.length <= 0 && addRow
        ? (
          <>
            <TextIconButton
              text={trlb('insurancesPopover_addRow')}
              icon={<Add sx={{ marginRight: '5px' }} />}
              onClick={() => addRow()}
            />
          </>
        )
        : null}
    </GridToolbarContainer>
  )
}

export default InsurancesPopover
