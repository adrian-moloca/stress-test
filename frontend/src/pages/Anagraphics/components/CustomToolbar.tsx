import React from 'react'
import { GridColumns, GridToolbarContainer } from '@mui/x-data-grid'
import { TextIconButton } from 'components/Buttons'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAnagraphicsContext } from './AnagraphicContext'
import { getLanguage, trlb } from 'utilities'
import CSVUpload from './CSVUpload'
import PageSelector from './PageSelector'
import { Box } from '@mui/material'
import { useAppSelector } from 'store'
import ExportButton from 'components/ExportButton'
import { format } from 'date-fns'
import { IAnagraphicRow } from '@smambu/lib.constants'
import { getMuiDataGridData } from 'utilities/misc'
import { getAnagraphicTypeLabel, getSubTypeLabel } from './MainContainer'

const Spacer = () => (
  <div
    style={{
      width: '20px',
      height: '20px',
      borderRight: '1px solid lightGrey',
      marginRight: '20px',
    }}
  />
)

const CustomToolbar = ({
  filteredRows,
  dataGridColumn,
}: {
  filteredRows: IAnagraphicRow[]
  dataGridColumn: GridColumns
}) => {
  const language = getLanguage()
  const {
    edit,
    addNewLine,
    page,
    pageSize,
    setPage,
    userPermissions,
    version,
    form,
    deleteAllRows,
    anagraphicSetup,
    selectedSubType,
  } = useAnagraphicsContext()
  const isLoading = useAppSelector(state => state.global.loading.length)

  const insertNewLine = async () => {
    await addNewLine(page, pageSize)

    // XXX careful! Since the form values aren't updated yet, we must add
    // one to the form values length
    const howManyPages = Math.ceil((form.values.length + 1) / pageSize)
    const lastPage = howManyPages - 1

    setPage(lastPage)
  }

  const getLabel = () => {
    const subType = anagraphicSetup.subTypes?.find?.(subType => subType === selectedSubType)
    if (!subType) return getAnagraphicTypeLabel(anagraphicSetup, language)

    return getSubTypeLabel(anagraphicSetup, subType, language)
  }

  return (
    <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey', pb: 0.5 }}>
      {userPermissions.export && (
        <ExportButton
          noClipboard
          getData={() => getMuiDataGridData(dataGridColumn, filteredRows)}
          title={`${getLabel()}_${format(new Date(), trlb('dateTime_datetime_csv_string'))}`}
        />
      )}
      {edit && (
        <>
          {userPermissions.upload && (
            <>
              {userPermissions.export && <Spacer />}
              <CSVUpload />
              <Spacer />
            </>
          )}
          <TextIconButton
            onClick={insertNewLine}
            text={trlb('anagraphics_toolbar_newRow')}
            icon={<AddIcon sx={{ marginRight: '5px' }} />}
            disabled={isLoading}
          />
          {version?.new && (
            <>
              <Spacer />
              <TextIconButton
                disabled={!form.values?.length}
                text={trlb('anagraphics_toolbar_clearAll')}
                icon={<DeleteIcon sx={{ marginRight: '5px' }} />}
                onClick={deleteAllRows}
              />
            </>
          )}
        </>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <PageSelector />
    </GridToolbarContainer>
  )
}

export default CustomToolbar
