import { eScheduleNoteTimeSteps, formatScheduleNoteFromBackend, permissionRequests, tCreateScheduleNoteDto, tEditScheduleNoteDto, tScheduleNote } from '@smambu/lib.constants'
import useCall from './useCall'
import { ScheduleNotesApi } from 'api/scheduleNotes.api'
import React, { useState } from 'react'
import { useGetCheckPermission } from './userPermission'

const LIMIT = import.meta.env.VITE_DEFAULT_NOTIFICATIONS_LIMIT || 20

export type tScheduleNoteStateSection = Record<tScheduleNote['_id'], tScheduleNote>

type tScheduleNoteState = {
  [timeStep in eScheduleNoteTimeSteps]: tScheduleNoteStateSection
}

export const useGetScheduleNotes = ({
  timestamp, timeStep
}: {
  timestamp: number
  timeStep: eScheduleNoteTimeSteps
}) => {
  const [scheduleNotes, setScheduleNotes] = useState<tScheduleNoteState>({
    [eScheduleNoteTimeSteps.DAYS]: {},
    [eScheduleNoteTimeSteps.WEEKS]: {},
    [eScheduleNoteTimeSteps.MONTHS]: {}
  })
  const call = useCall()
  const checkPermission = useGetCheckPermission()

  const canEditScheduleNotes = checkPermission(permissionRequests.canEditScheduleNotes)

  const createScheduleNote = (data: tCreateScheduleNoteDto) =>
    call(async function createScheduleNote () {
      const response: tScheduleNote = await ScheduleNotesApi.createScheduleNote(data)
      const updatedScheduleNotes = { ...scheduleNotes }
      updatedScheduleNotes[response.timeStep][response._id] =
        formatScheduleNoteFromBackend(response)
      return response
    })

  const editScheduleNote = (data: tEditScheduleNoteDto) =>
    call(async function createScheduleNote () {
      const response: tScheduleNote = await ScheduleNotesApi.editScheduleNote(data)
      const updatedScheduleNotes = { ...scheduleNotes }
      updatedScheduleNotes[response.timeStep][response._id] =
        formatScheduleNoteFromBackend(response)
      return response
    })

  React.useEffect(() => {
    const getScheduleNotes = () =>
      call(async function getScheduleNotes () {
        const reduceScheduleNotes = (notes: tScheduleNote[]) => notes
          .reduce((acc: tScheduleNoteStateSection, note: tScheduleNote) => {
            acc[note._id] = formatScheduleNoteFromBackend(note)
            return acc
          }, {})

        let data = {
          [eScheduleNoteTimeSteps.DAYS]: [] as tScheduleNote[],
          [eScheduleNoteTimeSteps.WEEKS]: [] as tScheduleNote[],
          [eScheduleNoteTimeSteps.MONTHS]: [] as tScheduleNote[],
        }
        let page = 0 as number | null
        let totalCount = 0

        while (page != null) {
          const response = await ScheduleNotesApi.getScheduleNotes({
            timeStep,
            timestamp,
            page,
            limit: LIMIT
          })
          data = {
            [eScheduleNoteTimeSteps.DAYS]: [
              ...data[eScheduleNoteTimeSteps.DAYS] || [],
              ...response[eScheduleNoteTimeSteps.DAYS]
            ],
            [eScheduleNoteTimeSteps.WEEKS]: [
              ...data[eScheduleNoteTimeSteps.WEEKS] || [],
              ...response[eScheduleNoteTimeSteps.WEEKS]
            ],
            [eScheduleNoteTimeSteps.MONTHS]: [
              ...data[eScheduleNoteTimeSteps.MONTHS] || [],
              ...response[eScheduleNoteTimeSteps.MONTHS]
            ],
          }
          if (page === 0)
            totalCount = response.totalCount[0]?.count || 0

          const totalData = data[eScheduleNoteTimeSteps.DAYS].length +
            data[eScheduleNoteTimeSteps.WEEKS].length +
            data[eScheduleNoteTimeSteps.MONTHS].length

          const allEmpty = data[eScheduleNoteTimeSteps.DAYS].length === 0 &&
            data[eScheduleNoteTimeSteps.WEEKS].length === 0 &&
            data[eScheduleNoteTimeSteps.MONTHS].length === 0

          if (totalData >= totalCount || allEmpty)
            page = null
          else
            page++
        }
        setScheduleNotes({
          [eScheduleNoteTimeSteps.DAYS]:
            reduceScheduleNotes(data[eScheduleNoteTimeSteps.DAYS]),
          [eScheduleNoteTimeSteps.WEEKS]:
            reduceScheduleNotes(data[eScheduleNoteTimeSteps.WEEKS]),
          [eScheduleNoteTimeSteps.MONTHS]:
            reduceScheduleNotes(data[eScheduleNoteTimeSteps.MONTHS])
        })
        return data
      })

    getScheduleNotes()
  }, [timestamp, timeStep])

  return { scheduleNotes, canEditScheduleNotes, createScheduleNote, editScheduleNote }
}
