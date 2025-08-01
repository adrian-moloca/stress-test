/* eslint-disable spaced-comment */
import React, { useState } from 'react'
import { Box, Tabs, Tab, Card } from '@mui/material'
import { PageContainer, PageHeader, Space20 } from 'components/Commons'
import { SaveButton, TextIconButton } from 'components/Buttons'
import EditIcon from '@mui/icons-material/Edit'
import { trlb } from 'utilities/translator/translator'
import { useAppSelector } from 'store'
import FieldsConfigurations from './components/FieldsConfigurations'
import {
  caseNumbersConfigsFields,
  debtorNumbersConfigsFields,
  fileConfigsFields,
  generalDataFields,
  ISystemConfiguration,
  onSystemConfigurationChange,
  patientNumbersConfigsFields,
  pcMaterialsNumbersConfigsFields,
  pricePointConfigsFields,
  systemConfigurationPermissions,
  systemConfigurationSaveControl,
  systemConfigurationSections,
} from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import FreeFieldsConfigurations from './components/FreeFieldsConfigurations'
import { useEditSystemConfiguration } from 'hooks/systemConfigurationHooks'
import EnviromentConfigurationsFields from './components/EnviromentConfigurationsFields'

const SystemConfigurationPage = () => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const checkPermission = useGetCheckPermission()
  const editSystemConfiguration = useEditSystemConfiguration()

  const visibleTabs = React.useMemo(
    () =>
      Object.values(systemConfigurationSections)
        .filter(tab => checkPermission(systemConfigurationPermissions[tab])),
    [],
  )

  const [visibleTab, setVisibleTab] = useState<systemConfigurationSections>(visibleTabs[0])
  const [editedTabs, setEditedTabs] = useState<systemConfigurationSections[]>([])
  const configs = useAppSelector(state => state.configs ?? {})
  const [values, setValues] = useState<ISystemConfiguration>(configs)

  React.useEffect(() => {
    if (Object.keys(configs).length > 0 && Object.keys(values).length === 0) setValues(configs)
  }, [configs, values])

  const onChange: onSystemConfigurationChange = (tab, key, value) => {
    if (!editedTabs.includes(tab)) setEditedTabs([...editedTabs, tab])
    setValues({
      ...values,
      [tab]:
        key == null
          ? value
          : {
            ...values[tab],
            [key]: value,
          },
    })
  }

  const onSave = async () => {
    const response = await editSystemConfiguration(visibleTab, values[visibleTab])
    if (response) setEditedTabs(editedTabs.filter(tab => tab !== visibleTab))
  }

  const onCancel = () => {
    setValues({
      ...values,
      [visibleTab]: configs[visibleTab],
    })
    setEditedTabs(editedTabs.filter(tab => tab !== visibleTab))
  }

  const saveAbilitated =
    editedTabs.includes(visibleTab) &&
    systemConfigurationSaveControl[visibleTab]?.(values[visibleTab]) &&
    !isLoading

  // So,this should probably it's own component or a list of
  // single components that works better than this - but that
  // would require a huge refactor.
  // This way we have a bettere approach to the selection while still
  // retaining the original structure
  const getAppropriateField = () => {
    switch (visibleTab) {
      case systemConfigurationSections.FILE_CONFIGS:
        return (
          <FieldsConfigurations
            section={systemConfigurationSections.FILE_CONFIGS}
            fields={fileConfigsFields}
            values={values[systemConfigurationSections.FILE_CONFIGS] ?? {}}
            onChange={onChange}
          />
        )

      case systemConfigurationSections.PRICE_POINT_CONFIGS:
        return (
          <FieldsConfigurations
            section={systemConfigurationSections.PRICE_POINT_CONFIGS}
            fields={pricePointConfigsFields}
            values={values[systemConfigurationSections.PRICE_POINT_CONFIGS] ?? {}}
            onChange={onChange}
            numberAsPrices
            noDecimalLimit
          />
        )

      case systemConfigurationSections.SUBJECT_AREAS:
        return (
          <FreeFieldsConfigurations
            section={systemConfigurationSections.SUBJECT_AREAS}
            onChange={onChange}
            values={values[systemConfigurationSections.SUBJECT_AREAS] ?? []}
          />
        )

      case systemConfigurationSections.CASE_NUMBERS_CONFIGS:
        return (
          <FieldsConfigurations
            fields={caseNumbersConfigsFields}
            section={systemConfigurationSections.CASE_NUMBERS_CONFIGS}
            onChange={onChange}
            values={values[systemConfigurationSections.CASE_NUMBERS_CONFIGS] ?? {}}
          />
        )

      case systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS:
        return (
          <FieldsConfigurations
            fields={pcMaterialsNumbersConfigsFields}
            section={systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS}
            onChange={onChange}
            values={values[systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS] ?? {}}
          />
        )

      case systemConfigurationSections.PATIENT_NUMBERS_CONFIGS:
        return (
          <FieldsConfigurations
            fields={patientNumbersConfigsFields}
            section={systemConfigurationSections.PATIENT_NUMBERS_CONFIGS}
            onChange={onChange}
            values={values[systemConfigurationSections.PATIENT_NUMBERS_CONFIGS] ?? {}}
          />
        )

      case systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS:
        return (
          <FieldsConfigurations
            fields={debtorNumbersConfigsFields}
            section={systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS}
            onChange={onChange}
            values={values[systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS] ?? {}}
          />
        )

      case systemConfigurationSections.SUPPLIER_CODES:
        return (
          <FreeFieldsConfigurations
            section={systemConfigurationSections.SUPPLIER_CODES}
            onChange={onChange}
            values={values[systemConfigurationSections.SUPPLIER_CODES] ?? []}
          />
        )

      case systemConfigurationSections.COUNT_CONTROL:
        return (
          <FreeFieldsConfigurations
            section={systemConfigurationSections.COUNT_CONTROL}
            onChange={onChange}
            values={values[systemConfigurationSections.COUNT_CONTROL] ?? []}
          />
        )

      case systemConfigurationSections.GENERAL_DATA:
        return (
          <FieldsConfigurations
            fields={generalDataFields}
            section={systemConfigurationSections.GENERAL_DATA}
            onChange={onChange}
            values={values[systemConfigurationSections.GENERAL_DATA] ?? {}}
          />
        )

      case systemConfigurationSections.ENVIRONMENT_CONFIG:
        return (
          <EnviromentConfigurationsFields
            fields={values[systemConfigurationSections.ENVIRONMENT_CONFIG]}
            onChange={onChange}
          />
        )

      default:
        return null
    }
  }

  return (
    <PageContainer sx={{ mb: 0, pb: 0, flex: 1 }}>
      <PageHeader pageTitle={trlb('systemConfiguration_title')}>
        {editedTabs.includes(visibleTab) && configs[visibleTab] && (
          <TextIconButton text={trlb('commons_cancel')} onClick={onCancel} disabled={isLoading} />
        )}
        <SaveButton onClick={onSave} disabled={!saveAbilitated} />
      </PageHeader>
      <Space20 />
      <Card sx={{ width: '100%', display: 'flex', flex: '1 1 100px', overflow: 'hidden' }}>
        <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', overflow: 'auto', height: '100%' }}>
          <Tabs
            orientation='vertical'
            value={visibleTab}
            onChange={(_event, newValue) => setVisibleTab(newValue)}
            textColor='primary'
            indicatorColor='primary'
            sx={{ borderRight: 1, borderColor: 'divider' }}
            variant='scrollable'
          >
            {visibleTabs.map(tab => {
              const edited = editedTabs.includes(tab)
              return (
                <Tab
                  key={tab}
                  value={tab}
                  label={
                    <Box display='flex' alignItems='center'>
                      {edited ? <EditIcon /> : null}
                      <span>
                        {trlb(`systemConfiguration_${tab}_tab`)}
                      </span>
                    </Box>
                  }
                  sx={{
                    fontWeight: '600',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                  }}
                />
              )
            })}
          </Tabs>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            overflow: 'auto',
            pl: 2,
          }}
        >
          {getAppropriateField()}
        </Box>
      </Card>
    </PageContainer>
  )
}

export default SystemConfigurationPage
