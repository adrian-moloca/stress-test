import { Box, Button, Toolbar, Typography } from '@mui/material'
import { DeleteButton, EditButton, SaveButton, DefaultButton } from 'components/Buttons'
import { getLanguage, trlb } from 'utilities'
import React from 'react'
import StandardDialog from 'components/StandardDialog'
import { useAnagraphicsContext } from './AnagraphicContext'
import { Clear } from '@mui/icons-material'
import { FlexSearchField } from 'components/FlexCommons'
import { useAppSelector } from 'store'
import { getAnagraphicTypeLabel } from './MainContainer'

interface ITopBarProps {
  disableSave?: boolean
}

const TopBar: React.FC<ITopBarProps> = ({ disableSave }) => {
  const {
    anagraphicSetup,
    edit,
    setEdit,
    cancelEdit,
    version,
    userPermissions,
    createNewVersion,
    onSave,
    deleteVersion,
    form,
    searchText,
    setSearchText,
    rowsWithDuplicateKeys,
  } = useAnagraphicsContext()
  const language = getLanguage()
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const [warningModal, setWarningModal] = React.useState(false)
  const [deleteModal, setDeleteModal] = React.useState(false)
  const onlyOneVersion = !version?.nextVersion && !version?.previousVersion

  if (!version) return null

  const onCreate = () => (!version?.nextVersion ? createNewVersion(version) : setWarningModal(true))

  const canSave = !disableSave && form.isValid && !rowsWithDuplicateKeys.length

  return (
    <>
      <StandardDialog
        open={warningModal}
        onClose={() => setWarningModal(false)}
        onConfirm={() => {
          createNewVersion(version)
          setWarningModal(false)
        }}
        titleKey={'anagraphics_newVersion_warning_title'}
        textKey={'anagraphics_newVersion_warning_text'}
      />
      <StandardDialog
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => {
          deleteVersion()
          setDeleteModal(false)
        }}
        titleKey={'anagraphics_deleteVersion_title'}
        textKey={'anagraphics_deleteVersion_text'}
      />
      <Toolbar sx={{ justifyContent: 'space-between' }} disableGutters>
        <FlexSearchField
          searchText={searchText}
          setSearchText={setSearchText}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexBasis: 0,
            flexGrow: 1,
          }}
        >
          <Typography variant='h4' sx={{ width: '100%', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {getAnagraphicTypeLabel(anagraphicSetup, language)}
          </Typography>
        </Box>
        {userPermissions.edit && !edit && (
          <>
            {anagraphicSetup.versioningEnabled && (
              <Button sx={{ mr: 1 }} onClick={onCreate} disabled={isLoading}>
                {trlb('anagraphics_newVersion_Button')}
              </Button>
            )}
            {version._id != null && <EditButton setEdit={setEdit} disabled={isLoading} />}
          </>
        )}
        {userPermissions.edit && edit && (
          <>
            {userPermissions.deleteVersion && !onlyOneVersion && !version.new && (
              <DeleteButton onClick={() => setDeleteModal(true)} disabled={isLoading} />
            )}
            {(!version.new || !onlyOneVersion) && (
              <DefaultButton
                icon={<Clear />}
                text={trlb('commons_cancel')}
                onClick={cancelEdit}
                sx={{ ml: 1 }}
                disabled={isLoading}
              />
            )}
            <SaveButton disabled={!canSave || isLoading} onClick={onSave} sx={{ ml: 1 }} />
          </>
        )}
      </Toolbar>
    </>
  )
}

export default TopBar
