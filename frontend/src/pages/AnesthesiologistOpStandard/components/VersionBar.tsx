import { AnesthesiologistOpStandard } from '@smambu/lib.constants'
import { Button, Toolbar } from '@mui/material'
import { Panel, SectionSubtitle } from 'components/Commons'
import React from 'react'
import { ArrowLeft, ArrowRight } from '@mui/icons-material'
import { trlb } from 'utilities'
import { routes } from 'routes/routes'
import { useNavigate } from 'react-router-dom'
import { format, isValid } from 'date-fns'
import { useGetAnesthesiologistOPStandardNearVersions } from 'hooks'

const VersionBar = ({
  anesthesiologistOpStandard,
  edit,
  isNew,
  nearVersions,
}: {
  anesthesiologistOpStandard?: AnesthesiologistOpStandard
  edit?: boolean
  isNew?: boolean
  nearVersions: ReturnType<typeof useGetAnesthesiologistOPStandardNearVersions>
}) => {
  const navigate = useNavigate()
  const fromDate = isValid(new Date(anesthesiologistOpStandard?.validFrom!))
    ? format(new Date(anesthesiologistOpStandard?.validFrom!), trlb('dateTime_date_string'))
    : ''

  const untilDate = isValid(new Date(nearVersions?.nextVersion?.validFrom!))
    ? format(new Date(nearVersions?.nextVersion?.validFrom!), trlb('dateTime_date_string'))
    : ''

  if (isNew) return null
  return (
    <Panel>
      <Toolbar>
        {!edit
          ? (
            <Button
              onClick={() => navigate(routes
                .mapAnesthesiologistOPStandardDetails(nearVersions.previousVersion?._id!))}
              disabled={!nearVersions.previousVersion?._id}
            >
              <ArrowLeft /> {trlb('op_standard_previous_version')}
            </Button>
          )
          : null}
        <SectionSubtitle
          text={trlb(untilDate ? 'opStandard_versionValidFromUntil' : 'opStandard_versionValidFrom', {
            fromDate,
            untilDate,
          })}
        />
        {!edit
          ? (
            <Button
              onClick={() => navigate(routes
                .mapAnesthesiologistOPStandardDetails(nearVersions.nextVersion?._id!))}
              disabled={!nearVersions.nextVersion?._id}
            >
              {trlb('next_version')}
              <ArrowRight />
            </Button>
          )
          : null}
      </Toolbar>
    </Panel>
  )
}

export default VersionBar
