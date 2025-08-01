import { Contract, ContractStatus, IUser, Identifier, getFullName } from '@smambu/lib.constants'
import { Box, Grid, Typography } from '@mui/material'
import { GridAutocomplete, Panel, SectionTitle, Space20 } from 'components/Commons'
import { addDays, differenceInCalendarDays, isValid } from 'date-fns'
import { FormikProps } from 'formik'
import { useCopyOpStandards, useGetContracts } from 'hooks/contractHooks'
import React from 'react'
import { trlb } from 'utilities'

const CopyBar = ({
  isNew,
  doctors,
  form,
  handleSelectDoctor,
}: {
  isNew?: boolean
  doctors: Record<Identifier, IUser>
  form: FormikProps<Omit<Contract, 'contractId' | 'tenantId'>>
  handleSelectDoctor: (doctor?: IUser) => void
}) => {
  const [doctorToCopy, setDoctorToCopy] = React.useState<Identifier>()
  const [contractList, setContractList] = React.useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = React.useState<Contract>()
  const getContracts = useGetContracts()
  const copyOpStandards = useCopyOpStandards()

  const lastContract = React.useMemo(() => {
    if (contractList.length > 0) {
      const contractListToSort = contractList

      contractListToSort.sort((a, b) => {
        const parsedBDate = new Date(b.details.validUntil)
        const parsedADate = new Date(a.details.validUntil)

        return differenceInCalendarDays(parsedBDate,
          parsedADate)
      })

      return contractListToSort[0]
    }

    return null
  }, [contractList])

  const handleSelectDoctorForCopying = (doctor?: IUser) => {
    setDoctorToCopy(doctor?._id)
    getContracts({
      status: ContractStatus.All,
      doctorId: doctor?._id,
    }).then(res => {
      if (res) setContractList(res.results)
    })
  }

  const handleCopyContract = async (contract: Contract) => {
    handleSelectDoctor(contract
      ?.details
      ?.doctorId
      ? doctors[contract?.details?.doctorId]
      : undefined)
    const opStandards = await copyOpStandards(contract)
    const date = isValid(new Date((lastContract ?? contract)?.details?.validUntil!))
      ? new Date((lastContract ?? contract)?.details?.validUntil!)
      : new Date()
    form.setValues({
      ...contract,
      details: {
        ...contract.details,
        validFrom: addDays(date, 1),
        validUntil: addDays(date, 1),
        status: undefined,
        surgerySlots: [],
        _id: undefined,
      },
      createdAt: undefined,
      updatedAt: undefined,
      contractId: undefined,
      opStandards,
    } as any)
  }

  if (!isNew) return null
  return (
    <Panel>
      <SectionTitle text={trlb('duplicate_contract')} />
      <Grid container spacing={2}>
        <GridAutocomplete
          xs={6}
          label={trlb('formBooking_Doctor')}
          options={Object.values(doctors)}
          selected={doctorToCopy}
          onSelectValue={(_e, doctor) => handleSelectDoctorForCopying(doctor)}
          getOptionLabel={(doctor: IUser) => getFullName(doctor, true)}
        />
        <GridAutocomplete
          xs={6}
          label={trlb('contract')}
          options={contractList.map(contract => ({
            label: contract.details.contractName,
            value: contract.contractId,
          }))}
          selected={selectedContract?.contractId}
          onSelectValue={(_e, obj) => {
            const contract = contractList.find(contract => contract.contractId === obj.value)
            setSelectedContract(contract)
            if (contract) handleCopyContract(contract)
          }}
          disabled={!doctorToCopy}
        />
      </Grid>
      <Space20 />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant='subtitle1' sx={{ width: '100%', textAlign: 'center' }}>
          {trlb('orFill_in_the_fields')}
        </Typography>
      </Box>
    </Panel>
  )
}

export default CopyBar
