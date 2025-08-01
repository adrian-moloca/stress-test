import { ToastType, downloadFileForFE, tCellData } from '@smambu/lib.constants'
import { SaveAlt } from '@mui/icons-material'
import { Box, Button, Popover } from '@mui/material'
import { useCall } from 'hooks'
import Papa from 'papaparse'
import React from 'react'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'
import { trlb } from 'utilities'
import * as XLSX from 'xlsx'

const sanitizeTitle = (title: string) =>
  title
    .substring(0, 30)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()

const ExportButton = ({
  getData,
  title,
  buttonText,
  noCSV,
  noClipboard,
  noXLSX,
}: {
  getData: () => Promise<tCellData[][]> | tCellData[][]
  title: string
  buttonText?: string
  noCSV?: boolean
  noClipboard?: boolean
  noXLSX?: boolean
}) => {
  const call = useCall()
  const dispatch = useDispatch()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  const exportCSV = () =>
    call(async function exportCSV () {
      const data = await getData()
      downloadFileForFE(new Blob([Papa.unparse(data)], { type: 'text/csv;charset=utf-8;' }), sanitizeTitle(title) + '.csv')
    })

  const exportToClipboard = () =>
    call(async function exportToClipboard () {
      try {
        const data = await getData()
        const text = data.map(row => row.join('\t')).join('\n')
        navigator.clipboard.writeText(text)
        dispatch({
          type: GLOBAL_ACTION.ADD_TOAST,
          data: {
            type: ToastType.success,
            text: 'commons_exportClipboard_success',
          },
        })
      } catch (error) {
        console.error(error)
        dispatch({ type: ToastType.error, text: (error as any).message })
      }
    })

  const exportXLSX = () =>
    call(async function exportXLSX () {
      const data = await getData()
      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sanitizeTitle(title))
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      downloadFileForFE(new Blob([wbout]), sanitizeTitle(title) + '.xlsx')
    })

  if (noCSV && noClipboard && noXLSX) return null
  if (noCSV && noClipboard) return <Button onClick={exportXLSX}>{trlb('commons_exportXLSX')}</Button>
  if (noCSV && noXLSX) return <Button onClick={exportToClipboard}>{trlb('commons_exportClipboard')}</Button>
  if (noClipboard && noXLSX) return <Button onClick={exportCSV}>{trlb('commons_exportCSV')}</Button>

  return (
    <>
      <Button onClick={handleClick}>
        <SaveAlt sx={{ mr: 1 }} />
        {trlb(buttonText ?? 'commons_export')}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1, gap: 1, display: 'flex', flexDirection: 'column' }}>
          {noCSV ? null : <Button onClick={exportCSV}>{trlb('commons_exportCSV')}</Button>}
          {noClipboard ? null : <Button onClick={exportToClipboard}>{trlb('commons_exportClipboard')}</Button>}
          {noXLSX ? null : <Button onClick={exportXLSX}>{trlb('commons_exportXLSX')}</Button>}
        </Box>
      </Popover>
    </>
  )
}

export default ExportButton
