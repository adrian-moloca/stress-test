import React from 'react'
import OpStandardTable from './OpStandardTable'

export const DynamicTable = ({
  tablesProps,
  edit,
  form,
  showDocumentationWarnings,
  showBillingWarning,
}: {
  tablesProps: { data: any; noAddButtonOnEmpty: boolean }[]
  edit: boolean
  form: any
  showDocumentationWarnings?: boolean
  showBillingWarning?: boolean
}) => {
  return (
    <>
      {tablesProps.map((tP, index) => (
        <OpStandardTable
          key={index}
          {...{
            edit,
            form,
            ...tP.data,
            noAddButtonOnEmpty: tP.noAddButtonOnEmpty,
            showDocumentationWarnings,
            showBillingWarning
          }}
        />
      ))}
    </>
  )
}
