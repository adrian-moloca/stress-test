import { expect } from '@playwright/test'
import { loginDefaultSuperUser } from './functions'
import { OperatingRoom } from '@smambu/lib.constantsjs'
import { DefaultTestType, InputTestSpec, RoomFixture } from '../types/types'

export const createRoomFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  input_rooms: OperatingRoom[]
) => {
  input_rooms.forEach(input_room => {
    const room_name = input_room.name
    test = test.extend<RoomFixture>({
      rooms:
        async ({ browser, rooms }, use) => {
          const page = await browser.newPage()
          await page.goto(process.env.APP_URL as string)

          const roomExists = await checkIfRoomExistsViaApi(room_name)
          let result: OperatingRoom
          if (!roomExists) result = await createRoomViaApi(room_name)
          else result = roomExists

          await use([...rooms, result])
        }
    })
  })
  return test
}

const checkIfRoomExistsViaApi = async (name: string) => {
  const token = await loginDefaultSuperUser()
  const response = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_OR_MANAGEMENT_SERVICE_HOST}:${process.env.OR_MANAGEMENT_PORT}/api/or-management/or-management`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  expect(response.ok).toBeTruthy()

  const rooms = await response.json()
  const targetRoom = rooms.find((r: OperatingRoom) => r.name === name)
  return targetRoom
}

const createRoomViaApi = async (name: string) => {
  const token = await loginDefaultSuperUser()
  const response = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_OR_MANAGEMENT_SERVICE_HOST}:${process.env.OR_MANAGEMENT_PORT}/api/or-management/or-management`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenantId: '',
        operatingRoomId: '',
        customRoomId: name,
        name,
        status: 'AVAILABLE',
        notes: '',
        exception: {
          startDate: null,
          endDate: null,
          repeatedEvery: [],
        },
      }),
    }
  )

  return await response.json()
}
