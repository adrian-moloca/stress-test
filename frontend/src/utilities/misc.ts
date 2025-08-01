import { parseErrorMessage, tColumn } from '@smambu/lib.constants'
import { GridRowsProp } from '@mui/x-data-grid'
import axios, { AxiosError } from 'axios'

export const getReadableErrorMessage = (error: AxiosError | Error) => {
  // partially taken from https://axios-http.com/docs/handling_errors
  try {
    if (axios.isAxiosError(error))
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (typeof error.response.data.message === 'string')
          return error.response.data.message

        return error.response.data.message.message
      } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
        return error.request.statusText
      }
  } catch (e) {
    // in case there is an error while parsing the error message,
    // we catch it and log it
    console.error('Error while parsing error message:', e)
    console.error('Original error:', error)
  }

  // Something happened in setting up the request that triggered an Error
  const message = parseErrorMessage(error)

  return message
}

export const MUIAutoCompleteSpaceFixer = (event: any) => {
  // XXX this is (yet another) mui mishap. Basically the space key is triggering
  // "stuff" in the datagrid when the autocomplete renders a textfield which is
  // placed inside a grid
  // ref https://github.com/mui/mui-x/issues/8970
  if (event.keyCode === 32) event.stopPropagation()
}

export const getMuiDataGridData = (columns: tColumn[], rows: GridRowsProp) => {
  const filteredColumns = columns.filter(column => !column.disableExport)
  const headers = filteredColumns.map(column => column.headerName?.replace(/\*$/g, '') || column.field) as any[]
  const data = rows.map(row =>
    filteredColumns.map(column => {
      const value =
        column.valueFormatter?.({ value: row[column.field] }) ??
        column.valueGetter?.({ row }) ??
        row[column.field]
      if (column.type === 'boolean') return value ? 1 : 0

      return value
    }))

  return [headers].concat(data)
}
