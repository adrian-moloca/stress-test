import { ArrowLeft, ArrowRight } from '@mui/icons-material'
import { Box, Button, Toolbar } from '@mui/material'
import { Panel, SectionSubtitle } from 'components/Commons'
import { FlexDateSelector } from 'components/FlexCommons'
import { isValid, subDays } from 'date-fns'
import React from 'react'
import { trlb } from 'utilities'
import { useAnagraphicsContext } from './AnagraphicContext'

const VersionBar = () => {
  const { edit, version, getVersion, setFromDate, userPermissions } = useAnagraphicsContext()
  const endDate = isValid(version?.nextVersion?.fromDate)
    ? subDays(version?.nextVersion?.fromDate!, 1)
    : null

  const onBack = () => getVersion(version?.previousVersion?._id!)
  const onForward = () => getVersion(version?.nextVersion?._id!)

  const canGoBack = version?.previousVersion?._id
  const canGoForward = version?.nextVersion?._id

  if (!version || (version.new && !userPermissions.edit))
    return (
      <Panel sx={{ p: 1 }}>
        <Toolbar variant='dense' sx={{ minHeight: 0 }}>
          <SectionSubtitle text={trlb('anagraphics_versionBar_noVersion')} margin='0px' />
        </Toolbar>
      </Panel>
    )

  return (
    version?.fromDate && (
      <Panel sx={{ p: 1 }}>
        <Toolbar variant='dense' sx={{ minHeight: 0 }}>
          {canGoBack && !version.new && !edit && !version.new
            ? (
              <Button startIcon={<ArrowLeft />} size='small' onClick={onBack} sx={{ whiteSpace: 'nowrap' }}>
                {trlb('anagraphics_versionBar_previousVersion')}
              </Button>
            )
            : (
              <Box sx={{ width: 150 }} />
            )}
          {version.new
            ? (
              <FlexDateSelector
                label={trlb('anagraphics_versionBar_newFromDate')}
                value={version.fromDate}
                onChange={setFromDate}
                canEdit
              />
            )
            : (
              <SectionSubtitle
                text={trlb(
                  endDate ? 'anagraphics_versionBar_validityWithEndDate' : 'anagraphics_versionBar_validityToInfinity',
                  {
                    startDate: version?.fromDate?.toLocaleDateString?.() ?? 'error',
                    endDate: endDate?.toLocaleDateString?.() ?? '',
                  },
                )}
                margin='0px'
              />
            )}
          {canGoForward && !version.new && !edit && !version.new
            ? (
              <Button
                endIcon={<ArrowRight />}
                size='small'
                onClick={onForward}
                disabled={!canGoForward || edit || version.new}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {trlb('anagraphics_versionBar_nextVersion')}
              </Button>
            )
            : (
              <Box sx={{ width: 150 }} />
            )}
        </Toolbar>
      </Panel>
    )
  )
}

export default VersionBar
