import {
  ALL_PERMISSIONS_ROLE,
  SIMPLE_OP_STANDARD,
  SIMPLE_AVAILABLE_ROOM,
  simpleAnagraphic,
  simpleAddress,
  publicInsurance,
} from './data/data'
import { prepareTest } from './setup/compile_test'
import { createCase, findOpStandardInContractsByName, findUserByName } from './utils/functions'

const contractDateStart = new Date()
contractDateStart.setHours(0, 0, 0, 0)

const contractDateEnd = new Date()
contractDateEnd.setDate(contractDateEnd.getDate() + 1)
contractDateEnd.setHours(0, 0, 0, 0)

const contractName = 'create-public-insurance-case-test-day-contract'
const doctorName = 'create-public-insurance-case-test-doctor-name'
const doctorSurname = 'create-public-insurance-case-test-doctor-surname'
const roleName = 'create-public-insurance-case-test-role-admin'
const opStandardName = 'create-public-insurance-case-test-opStandard'
const roomName = 'create-public-insurance-case-test-room'

prepareTest({
  available_insurances: [
    {
      public_insurance_name: 'public_insurance',
    },
    {
      private_insurance_name: 'private_insurance',
    },
    {
      bg_insurance_name: 'bg_insurance',
    },
    {
      public_insurance_name: 'public_insurance2',
    },
    {
      private_insurance_name: 'private_insurance2',
    },
    {
      bg_insurance_name: 'bg_insurance2',
    },
  ],
  cases: [],
  rooms: [SIMPLE_AVAILABLE_ROOM(roomName)],
  users: [
    {
      lastName: doctorSurname,
      title: '',
      firstName: doctorName,
      email: 'create-public-insurance-case-test@tester.com',
      phoneNumber: '123',
      birthDate: '11/11/1111',
      address: {
        city: '',
        country: '',
        houseNumber: '',
        postalCode: '',
        street: '',
      },
      role_names: [`${roleName}`],
    },
  ],
  contracts: [
    {
      details: {
        contractName,
        doctorId: { firstName: doctorName, lastName: doctorSurname },
        kassenzulassung: false,
        validFrom: contractDateStart.getTime(),
        validUntil: contractDateEnd.getTime(),
      },
      opStandards: [opStandardName],
    },
  ],
  opStandards: [SIMPLE_OP_STANDARD(opStandardName, [roomName])],
  roles: [ALL_PERMISSIONS_ROLE(`${roleName}`)],
})(
  'Create new booking request with insurance public',
  async ({
    page,
    baseURL,
    available_insurances,
    rooms,
    users,
    contracts,
    opStandards,
    roles,
    cases,
  }) => {
    await createCase(
      `${baseURL}`,
      page,
      findUserByName(users, doctorName),
      simpleAnagraphic,
      simpleAddress,
      findOpStandardInContractsByName(contracts, contractName, opStandardName),
      publicInsurance,
      available_insurances
    )
  }
)
