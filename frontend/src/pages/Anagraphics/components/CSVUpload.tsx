import React from 'react'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { getLanguage, trlb } from 'utilities'
import { useAnagraphicsContext } from './AnagraphicContext'
import DataCellSelector from './DataGridCells'
import { useCSVForm } from 'hooks/anagraphicsHooks'
import { Box, Button, Icon, Paper, Toolbar, Typography } from '@mui/material'
import StandardDialog from 'components/StandardDialog'
import { FlexDataTable } from 'components/FlexCommons'
import { Error, AddCircleOutline, CheckCircleOutline, DoNotDisturb } from '@mui/icons-material'
import { getHeaderName } from './MainContainer'

const CSVUpload = () => {
  const { anagraphicSetup, form: versionForm, rowsWithDuplicateKeys } = useAnagraphicsContext()
  const {
    csvForm,
    csvKeys,
    onEdit,
    showTable,
    onConfirm,
    emptyTable,
    handleFile,
    showModal,
    setShowModal,
    results,
    csvRowsWithDuplicateKeys,
    fieldKeys,
  } = useCSVForm({ anagraphicSetup, versionForm })
  const language = getLanguage()

  const dataGridColumn = [
    {
      field: 'isValid',
      headerName: '',
      width: 25,
      filterable: false,
      type: 'boolean',
      valueGetter: (params: any) => {
        const rowId = params.row.id

        if (results.invalid.includes(rowId)) return 0

        if (results.new.includes(rowId)) return 1

        if (results.updated.includes(rowId)) return 2

        return 3
      },
      renderCell: (params: any) => {
        const rowId = params.row.id

        const getComponent = () => {
          if (results.invalid.includes(rowId))
            return <Error sx={{ fill: theme => theme.palette.error.main }} />

          if (results.new.includes(rowId))
            return <AddCircleOutline sx={{ fill: theme => theme.palette.success.main }} />

          if (results.updated.includes(rowId))
            return <CheckCircleOutline sx={{ fill: theme => theme.palette.info.main }} />

          return <DoNotDisturb sx={{ fill: theme => theme.palette.grey[500] }} />
        }

        return <Icon>{getComponent()}</Icon>
      },
    },
    ...((anagraphicSetup?.fields ?? [])
      ?.filter?.(field => !field.noCSV && csvKeys.includes(field.name))
      ?.map?.(field => ({
        field: field.name,
        headerName: getHeaderName(field, language),
        width: 100, // TODO: manage width
        filterable: false,
        type: field.type,
        renderCell: (params: any) => (
          <DataCellSelector
            field={field}
            params={params}
            edit
            onEdit={onEdit}
            form={csvForm}
            disableSave={() => {}}
            rowsWithDuplicateKeys={csvRowsWithDuplicateKeys}
            fieldKeys={fieldKeys}
          />
        ),
      })) ?? []),
  ]

  return (
    <>
      <Button component='label' disabled={rowsWithDuplicateKeys.length > 0}>
        <FileUploadIcon sx={{ marginRight: '5px' }} />
        {trlb('anagraphics_uploadCSV_button')}
        {!showTable && ( // This is to empty the file input when the modal is open
          <input
            type='file'
            accept='.csv'
            hidden
            onChange={e => {
              if (e.target.files?.[0]) handleFile(e.target.files?.[0])
            }}
          />
        )}
      </Button>
      {showTable
        ? (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 2000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onClick={emptyTable}
          >
            <Paper
              onClick={e => e.stopPropagation()}
              sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', width: '95%', height: '95%' }}
            >
              <Typography variant='h5' sx={{ padding: '10px' }}>
                {trlb('anagraphics_uploadCSV_title')}
              </Typography>
              <FlexDataTable
                showToolbar
                columns={dataGridColumn}
                rowHeight={70}
                rows={csvForm.values}
                disableColumnMenu
              />
              <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Button onClick={emptyTable}>{trlb('commons_cancel')}</Button>
                <Toolbar disableGutters>
                  <DoNotDisturb sx={{ fill: theme => theme.palette.grey[500] }} />
                  <Typography sx={{ ml: 1, mr: 3 }}>
                    {trlb('anagraphics_uploadCSV_untouched', { count: String(results.untouched?.length) })}
                  </Typography>
                  <AddCircleOutline sx={{ fill: theme => theme.palette.success.main }} />
                  <Typography sx={{ ml: 1, mr: 3 }}>
                    {trlb('anagraphics_uploadCSV_new', { count: String(results.new?.length) })}
                  </Typography>
                  <CheckCircleOutline sx={{ fill: theme => theme.palette.info.main }} />
                  <Typography sx={{ ml: 1, mr: 3 }}>
                    {trlb('anagraphics_uploadCSV_update', { count: String(results.updated?.length) })}
                  </Typography>
                  <Error sx={{ fill: theme => theme.palette.error.main }} />
                  <Typography sx={{ ml: 1, mr: 3 }}>
                    {trlb('anagraphics_uploadCSV_invalid', { count: String(results.invalid?.length) })}
                  </Typography>
                </Toolbar>
                <Button variant='contained' color='primary' onClick={() => setShowModal(true)}>
                  {trlb('commons_confirm')}
                </Button>
              </Toolbar>
            </Paper>
          </Box>
        )
        : null}
      <StandardDialog
        open={showModal}
        onClose={() => setShowModal(false)}
        titleKey={'anagraphics_uploadCSV_confirmTitle'}
        textKey={'anagraphics_uploadCSV_confirmText'}
        onConfirm={onConfirm}
      >
        <Box sx={{ width: '100&', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          {results.untouched.length
            ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DoNotDisturb sx={{ fill: theme => theme.palette.grey[500], mr: 1 }} />
                <Typography variant='h6'>
                  {trlb('anagraphics_uploadCSV_untouchedRows', { count: String(results.untouched.length) })}
                </Typography>
              </Box>
            )
            : null}
          {results.new.length
            ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AddCircleOutline sx={{ fill: theme => theme.palette.success.main, mr: 1 }} />
                <Typography variant='h6'>
                  {trlb('anagraphics_uploadCSV_newRows', { count: String(results.new.length) })}
                </Typography>
              </Box>
            )
            : null}
          {results.updated.length
            ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutline sx={{ fill: theme => theme.palette.info.main, mr: 1 }} />
                <Typography variant='h6'>
                  {trlb('anagraphics_uploadCSV_updatedRows', { count: String(results.updated.length) })}
                </Typography>
              </Box>
            )
            : null}
          {results.invalid.length
            ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Error sx={{ fill: theme => theme.palette.error.main, mr: 1 }} />
                <Typography variant='h6'>
                  {trlb('anagraphics_uploadCSV_invalidRows', { count: String(results.invalid.length) })}
                </Typography>
              </Box>
            )
            : null}
        </Box>
      </StandardDialog>
    </>
  )
}

export default CSVUpload
