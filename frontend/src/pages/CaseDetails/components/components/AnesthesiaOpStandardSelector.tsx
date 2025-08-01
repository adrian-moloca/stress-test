import { CaseForm } from '@smambu/lib.constants'
import { FormikGridAutocomplete } from 'components/Commons'
import { FormikProps } from 'formik'
import { useGetAnesthesiologistOPStandardsNames } from 'hooks'
import React from 'react'
import { trlb } from 'utilities'

const AnesthesiaOpStandardSelector = ({
  form, edit, setopStandardSelected
}: {
  form: FormikProps<CaseForm>
  edit: boolean
  setopStandardSelected: (value: string) => void
}) => {
  const opstandardsNames = useGetAnesthesiologistOPStandardsNames()
  const selectedOpStandardId = form.values.anesthesiaSection.anesthesiologistOpStandardId
  const selectedOpStandardName = form.values.anesthesiaSection.name
  const deletedSelectedOpStandardId = !opstandardsNames.some(
    (opStandard: { id: string }) => opStandard.id === selectedOpStandardId
  )

  if (opstandardsNames == null) return null

  const OPStandardsOptions = [
    ...selectedOpStandardId != null && selectedOpStandardId !== ''
      ? [{
        value: selectedOpStandardId,
        label: deletedSelectedOpStandardId && opstandardsNames.length > 0
          ? trlb('case_tab_anesthesia_deletedSelectedOpStandard', { name: selectedOpStandardName })
          : selectedOpStandardName
      }]
      : [],
    ...opstandardsNames.map((opStandard: { name: string; id: string }) => ({
      value: opStandard.id,
      label: opStandard.name,
    })).filter((opStandard: { value: string }) => opStandard.value !== selectedOpStandardId),
  ]

  return (
    <FormikGridAutocomplete
      searchIcon={undefined}
      xs={6}
      label={trlb('case_tab_anesthesia_anesthesiologistOpStandard')}
      options={OPStandardsOptions || []}
      disabled={!edit}
      form={form}
      section='anesthesiaSection'
      errors={form.errors.anesthesiaSection}
      values={form.values.anesthesiaSection}
      touched={form.touched.anesthesiaSection}
      name='anesthesiologistOpStandardId'
      disableClearable
      onSelectValue={(_e: any, option: any) => {
        if (option?.value !== form.values.anesthesiaSection.anesthesiologistOpStandardId)
          setopStandardSelected(option?.value || '')
      }}
    />
  )
}

export default AnesthesiaOpStandardSelector
