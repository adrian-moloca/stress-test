import {
  IAnagraphicRow,
  IAnagraphicSetup,
  IAnagraphicVersion,
  tEvaluatedAnagraphicSetup,
} from '@smambu/lib.constants'
import { FormikProps } from 'formik'
import { useGetAnagraphics } from 'hooks/anagraphicsHooks'
import { useGetScreenSize } from 'hooks/uiHooks'
import React from 'react'

const defaultPaginationLimit = Number(import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT)
const defaultPaginationOptions = import.meta.env.VITE_DEFAULT_PAGINATION_OPTIONS.split(',').map(Number)
interface IAnagraphicContext {
  form: FormikProps<IAnagraphicRow[]>
  anagraphicSetup: IAnagraphicSetup
  userPermissions: IAnagraphicSetup['permissionsRequests']
  version: IAnagraphicVersion | undefined
  getVersion: (selectedVersionId: string) => void
  edit: boolean
  setEdit: (edit: boolean) => void
  cancelEdit: () => void
  createNewVersion: (version: IAnagraphicVersion) => void
  setFromDate: (fromDate: Date | null) => void
  addNewLine: (page: number, pageSize: number) => void
  deleteNewLine: (rowKey: string) => void
  deleteAllRows: () => void
  onEdit: ({ name, value, rowKey }: { name: string; value: any; rowKey: string }) => void
  onSave: () => void
  deleteVersion: () => void
  searchText: string
  setSearchText: (searchText: string) => void
  selectedSubType?: string
  setSelectedSubType: (selectedSubType: string) => void
  lowHeightScreen: boolean
  page: number
  setPage: (page: number) => void
  rowCount: number
  setRowCount: (rowCount: number) => void
  pageSize: number
  setPageSize: (pageSize: number) => void
  pageSizes: number[]
  rowsWithDuplicateKeys: string[]
  fieldKeys: string[]
}

const context = React.createContext<IAnagraphicContext>({
  form: {} as FormikProps<IAnagraphicRow[]>,
  anagraphicSetup: {} as IAnagraphicSetup,
  userPermissions: {} as IAnagraphicSetup['permissionsRequests'],
  version: undefined,
  getVersion: () => { },
  edit: false,
  setEdit: () => { },
  cancelEdit: () => { },
  createNewVersion: () => { },
  setFromDate: () => { },
  addNewLine: () => { },
  deleteNewLine: () => { },
  deleteAllRows: () => { },
  onEdit: () => { },
  onSave: () => { },
  deleteVersion: () => { },
  searchText: '',
  setSearchText: () => { },
  selectedSubType: undefined,
  setSelectedSubType: () => { },
  lowHeightScreen: false,
  page: 0,
  setPage: () => { },
  rowCount: 0,
  setRowCount: () => { },
  pageSize: defaultPaginationLimit,
  setPageSize: () => { },
  pageSizes: defaultPaginationOptions,
  rowsWithDuplicateKeys: [],
  fieldKeys: [],
})

export const useAnagraphicsContext = () => React.useContext(context)

export const AnagraphicsProvider = ({
  anagraphicType,
  anagraphicsSetups,
  children,
}: {
  anagraphicType: string
  anagraphicsSetups: Record<string, tEvaluatedAnagraphicSetup>
  children: React.ReactNode
}) => {
  const { height } = useGetScreenSize()
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(defaultPaginationLimit)
  const [rowCount, setRowCount] = React.useState(0)

  const {
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
  } = useGetAnagraphics({
    anagraphicType,
    anagraphicsSetups,
  })

  return (
    <context.Provider
      value={{
        userPermissions,
        anagraphicSetup,
        form: form as unknown as FormikProps<IAnagraphicRow[]>,
        version,
        getVersion,
        edit,
        setEdit,
        cancelEdit,
        createNewVersion,
        setFromDate,
        addNewLine,
        deleteNewLine,
        deleteAllRows,
        onEdit,
        onSave,
        deleteVersion,
        searchText,
        setSearchText,
        selectedSubType,
        setSelectedSubType,
        lowHeightScreen: height < 800,
        page,
        setPage,
        rowCount,
        setRowCount,
        pageSize,
        setPageSize,
        pageSizes: defaultPaginationOptions,
        rowsWithDuplicateKeys,
        fieldKeys,
      }}
    >
      {children}
    </context.Provider>
  )
}
