import React, { Dispatch, SetStateAction } from 'react'
import { Box } from '@mui/material'
import { GridAutocomplete, GridNumericField } from 'components/Commons'
import { TextIconButton } from 'components/Buttons'
import AddIcon from '@mui/icons-material/Add'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { MaterialPriceOverride, NewMaterial } from '@smambu/lib.constants'
import { trlb } from 'utilities'
import { FlexDataTable } from 'components/FlexCommons'
import { Add, Close } from '@mui/icons-material'

interface MaterialPricesManagementProps {
  setAddMaterial:
    | (() => void)
    | Dispatch<SetStateAction<boolean>>
    | Dispatch<SetStateAction<{ id: string; price: number }[]>>
  edit?: boolean
  materialPriceList: MaterialPriceOverride[]
  materials: NewMaterial[]
  onChange?: (materialList: { id: string; price: number }[]) => void
  defaultPrices?: MaterialPriceOverride[]
}

const MaterialPricesManagement: React.FC<MaterialPricesManagementProps> = ({
  setAddMaterial,
  edit,
  materials,
  materialPriceList,
  onChange = () => {},
  defaultPrices,
}) => {
  const [selectionModel, setSelectionModel] = React.useState('')
  const rows = materialPriceList.map((el, index) => ({ ...el, index, key: `${index}/${materialPriceList.length}` }))

  const handleChange = (item: any) => {
    let newArray = [...materialPriceList]
    newArray[item.index] = { id: item.id, price: item.price }
    onChange(newArray as any)
  }

  const handleSetDefaults = () => {
    onChange([...(defaultPrices ?? [])])
  }

  const options: Record<string, any> = {}

  if (materials != null)
    materials.forEach(el => {
      options[el.id] = {
        value: el.id,
        label: el.name,
      }
    })

  const optionsValues = Object.values(options)

  const deleteRow = (selectionModel: string[]) => {
    const newRows = rows
      .filter(row => !selectionModel.includes(row.key))
      .map(r => ({
        id: r.id,
        price: r.price,
      }))
    onChange(newRows as any)
    setSelectionModel('')
  }

  const columns = [
    {
      field: 'name',
      headerName: trlb('common_material'),
      flex: 1,
      renderCell: (params: any) => {
        const availableOptions = optionsValues
          .filter(el => materialPriceList.every(item => item.id !== el.value))

        return edit
          ? (
            <GridAutocomplete
              xs={12}
              label={trlb('common_material')}
              options={availableOptions}
              selected={optionsValues.find(el => el.value === params.row.id)}
              onSelectValue={(_e: any, v: any) => {
                handleChange({
                  index: params.row.index,
                  id: v.value,
                  price: params.row.price,
                })
              }}
              getOptionLabel={(option: any) => {
                return `${option.value} - ${option.label}`
              }}
            />
          )
          : (
            `${options[params.row.id].value} - ${options[params.row.id].label}`
          )
      },
    },
    {
      field: 'price',
      headerName: trlb('systemConfiguration_price'),
      flex: 1,
      renderCell: (params: any) =>
        edit
          ? (
            <GridNumericField
              xs={12}
              label='Price'
              value={params.value}
              onChange={(e: any) => {
                handleChange({
                  index: params.row.index,
                  id: params.row.id,
                  price: e.target.value,
                })
              }}
              isPrice
            />
          )
          : (
            params.value
          ),
    },
  ].filter(col => (!edit && col.field !== 'delete') || (edit && col))

  function CustomToolbar () {
    return (
      <GridToolbarContainer
        sx={{ borderBottom: '1px solid lightGrey', display: 'flex', justifyContent: 'space-between' }}
      >
        {edit && selectionModel.length > 0 && deleteRow && (
          <TextIconButton
            onClick={() => deleteRow(selectionModel)}
            text={trlb('insurancesPopover_deleteRow')}
            icon={<Close sx={{ marginRight: '5px' }} />}
          />
        )
        }
        {edit && setAddMaterial && (
          <TextIconButton
            text={trlb('contract_add_material_price_pair')}
            icon={<Add sx={{ marginRight: '5px' }} />}
            onClick={setAddMaterial}
          />
        )}
        {defaultPrices?.length && (
          <TextIconButton
            onClick={handleSetDefaults}
            text={trlb('systemConfiguration_addDefaults')}
            icon={<AddIcon sx={{ marginRight: '10px' }} />}
          />
        )}
      </GridToolbarContainer>
    )
  }
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        maxHeight: 700,
        backgroundColor: theme => theme.palette.background.paper,
        display: 'flex',
        overflow: 'auto',
      }}
    >
      <FlexDataTable
        columns={columns}
        rows={rows}
        getRowId={(row: any) => row.key}
        rowHeight={80}
        toolbar={CustomToolbar}
        showToolbar={edit}
        isRowSelectable={false}
        autoHeight={true}
        checkboxSelection={edit}
        selectionModel={selectionModel}
        onSelectionModelChange={(newSelectionModel: any) => {
          setSelectionModel(newSelectionModel)
        }}
        disable
        disableSelectionOnClick
      />
    </Box>
  )
}

export default MaterialPricesManagement
