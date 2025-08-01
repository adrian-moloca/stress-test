import { AnesthesiologistOpStandard, permissionRequests } from '@smambu/lib.constants'
import { Add } from '@mui/icons-material'
import { DefaultButton } from 'components/Buttons'
import StandardDialog from 'components/StandardDialog'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from 'routes/routes'
import { trlb } from 'utilities'

const CreateNewVersion = ({
  anesthesiologistOpStandard,
  isLastVersion,
}: {
  anesthesiologistOpStandard?: AnesthesiologistOpStandard
  isLastVersion: boolean
}) => {
  const checkPermission = useGetCheckPermission()
  const canCreateAnesthesiologistOpStandard = checkPermission(permissionRequests
    .canCreateAnesthesiologistOpStandard)
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  if (!canCreateAnesthesiologistOpStandard ||
    !anesthesiologistOpStandard?.anesthesiologistOpStandardId) return null

  const onConfirm = () =>
    navigate(routes.mapAnesthesiologistOPStandardNewVersion(anesthesiologistOpStandard
      ?.anesthesiologistOpStandardId!))

  return (
    <>
      <DefaultButton
        icon={<Add />}
        text={trlb('create_new_version')}
        onClick={() => (isLastVersion ? onConfirm() : setOpen(true))}
      />
      <StandardDialog
        open={open}
        onClose={() => setOpen(false)}
        titleKey={'op_standard_noLastVersionWarning_title'}
        textKey={'op_standard_noLastVersionWarning_text'}
        onConfirm={onConfirm}
      />
    </>
  )
}

export default CreateNewVersion
