import { Box, Button, Typography } from '@mui/material'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from 'store'
import { trlb } from 'utilities'
import UploadBox from './components/UploadBox'
import DifferencesBox from './components/DifferencesBox'
import ErrorsBox from './components/ErrorsBox'
import ConfirmBox from './components/ConfirmBox'
import { downloadFileForFE, tURConfigsData, URConfigs, tURConfigKeys } from '@smambu/lib.constants'
import { Panel } from 'components/Commons'
import { routes } from 'routes/routes'
import logo from 'assets/img/LogoSMAMBU.png'
import { parseISO } from 'date-fns'
import { useGetURConfigs, useSetURConfigs } from 'hooks/urHooks/configHooks'

export type tJsonError = { message: string, errorString?: string, errorIndex?: number }

const parseJsonWithErrorInfo = (jsonString: string): any | { jsonError: tJsonError } => {
  try {
    return JSON.parse(jsonString)
  } catch (error: any) {
    const errorString = /\.\.\.".*"\.\.\./.exec(error.message.replace('\n', ''))

    if (errorString != null) {
      const parsedString = errorString[0].replace(/"?\.\.\."?/g, '')
      return {
        jsonError: {
          message: error.message,
          errorString: parsedString,
        }
      }
    }

    const position = /position (\d+)/.exec(error.message)

    if (position) {
      const errorIndex = parseInt(position[1], 10)
      return {
        jsonError: {
          message: error.message,
          errorIndex,
        }
      }
    }
    return { jsonError: { message: error.message, errorString: '' } }
  }
}

const UniversalConfigurations = () => {
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const tenant = useAppSelector(state => state.tenants.tenants[tenantId!])

  // TODO UR: type oldData and newData
  const [oldData, setOldData] = React.useState<tURConfigsData | null>(null)
  const [newData, setNewData] = React.useState<tURConfigsData | null>(null)
  const [newDataString, setNewDataString] = React.useState<string | null>(null)

  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null)
  const [error, setErrors] = React.useState<tJsonError | null>(null)
  const [confirm, setConfirm] = React.useState<boolean>(false)
  const getURConfigs = useGetURConfigs()
  const setURConfigs = useSetURConfigs()

  React.useEffect(() => {
    const fetchOldData = async () => {
      try {
        if (tenantId == null) return

        const data = await getURConfigs(tenantId)

        const updatedAt = data?.updatedAt

        const lastUpdate = updatedAt != null
          ? parseISO(updatedAt)
          : null

        setLastUpdate(lastUpdate)

        const parsedData = { version: data.version }

        Object.values(URConfigs).forEach(current => {
          // @ts-expect-error remove this when everything is typed better, after the data structures
          // of the config are well-known and tested
          parsedData[current] = data?.[current as tURConfigKeys]?.data
        })

        setOldData(data)
      } catch (error) {
        console.error(error)
      }
    }

    if (tenantId != null)
      fetchOldData()
  }, [tenantId])

  if (tenantId == null)
    return null

  const handleFile = (file: File) => {
    try {
      const reader = new FileReader()
      reader.onload = () => {
        const response = parseJsonWithErrorInfo(reader.result as string)

        if (response.jsonError == null) {
          setNewData(response)
          setNewDataString(`${reader.result}`)
        } else {
          setNewData(response)
          setNewDataString(`${reader.result}`)
          setErrors(response.jsonError as tJsonError)
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error(error)
    }
  }

  const onDownload = () => {
    const blob = new Blob([JSON.stringify(oldData, null, 2)], { type: 'application/json' })

    const fileName = `${tenantId}-${new Date().toISOString()}-urConfigs.json`
    downloadFileForFE(blob, fileName)
  }

  const onReset = () => {
    setNewData(null)
    setNewDataString(null)
    setErrors(null)
    setConfirm(false)
  }

  const onConfirm = async () => {
    if (newData == null)
      throw new Error('No data to save') // This should never happen

    const response = await setURConfigs(
      tenantId,
      newData
    )

    if (response === true) {
      setLastUpdate(new Date())
      setOldData(newData)
      setNewData(null)
      setErrors(null)
      setConfirm(false)
    }
  }

  const getContent = () => {
    if (newData == null)
      return (
        <UploadBox
          onDownload={onDownload}
          handleFile={handleFile}
          lastUpdate={lastUpdate}
        />
      )

    if (error != null)
      return <ErrorsBox newData={newDataString!}
        error={error}
        onReset={onReset} />

    if (!confirm)
      return (
        <DifferencesBox
          oldData={oldData}
          newData={newData}
          onReset={onReset}
          onConfirm={() => setConfirm(true)}
        />
      )

    return (
      <ConfirmBox
        tenantName={tenant.name}
        onConfirm={onConfirm}
        onReset={onReset}
      />
    )
  }

  return (
    <Box sx={{ width: '90%', height: '90%', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }} >
        <Button variant='outlined'
          color='primary'
          onClick={() => navigate(routes.home)}>
          {trlb('commons_back')}
        </Button>
        <Typography
          variant='h4'
          sx={{
            fontWeight: 600,
            width: '100%',
            whiteSpace: 'nowrap',
          }}
        >
          {trlb('ur_configs_title', { tenantName: tenant.name })}
        </Typography>
        <img src={logo}
          width={160} />
      </Box>
      <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', gap: 2 }}>
        <Panel sx={{ height: '100%', flexGrow: 1, p: 2 }}>
          {getContent()}
        </Panel>
      </Box>
    </Box>
  )
}

export default UniversalConfigurations
