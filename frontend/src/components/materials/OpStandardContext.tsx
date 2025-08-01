import { NewMaterial, Medication, SterileGoodUnits, OpStandard } from '@smambu/lib.constants'
import { useGoaNumbers, useMaterials, useMedications, useSterileGoods } from 'hooks/anagraphicsHooks'
import { useDoctorOpstandards } from 'hooks/contractHooks'
import React from 'react'

interface IOpStandardManagementContext {
  medications: Medication[]
  materials: NewMaterial[]
  goaNumbers: number[]
  sterileGoods: Record<SterileGoodUnits, { id: string; label: string, key: string }[]>
  doctorOpstandards: OpStandard[]
}

const context = React.createContext<IOpStandardManagementContext>({
  medications: [],
  materials: [],
  goaNumbers: [],
  sterileGoods: {
    [SterileGoodUnits.SET]: [],
    [SterileGoodUnits.SINGLE_INSTRUMENT]: [],
    [SterileGoodUnits.CONTAINER]: [],
  },
  doctorOpstandards: [],
})

export const useOpStandardManagementContext = () => React.useContext(context)

export const OpStandardManagementProvider = ({
  date,
  children,
  doctorId,
}: {
  date?: Date
  children: React.ReactNode
  doctorId?: string
}) => {
  const { materials } = useMaterials(date)
  const { medications } = useMedications(date)
  const { goaNumbers } = useGoaNumbers(date)
  const { sterileGoods } = useSterileGoods(date)
  const { doctorOpstandards } = useDoctorOpstandards(doctorId)

  return (
    <context.Provider
      value={{
        materials,
        medications,
        goaNumbers,
        sterileGoods,
        doctorOpstandards,
      }}
    >
      {children}
    </context.Provider>
  )
}
