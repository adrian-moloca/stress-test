import {
  Case,
  Contract,
  Gender_Name,
  InsuranceStatus,
  ISerializedUser,
  OperatingRoom,
  OpStandard,
  Role,
} from '@smambu/lib.constantsjs'
import {
  TestType,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
} from '@playwright/test'
import { getDefaultTest } from '../setup/compile_test'

// export interface Case {
//   caseUrl: string;
// }

export interface Anagraphics {
  title: string;
  name: string;
  surname: string;
  dateOfBirth: string;
  gender: Gender_Name;
  genderAtBirth: Gender_Name;
  nationality: string;
}

export type AnagraphicsForApi = Omit<Anagraphics, 'dateOfBirth' | 'genderAtBirth'> & {
  birthDate: string;
  genderBirth: Gender_Name;
}

export interface Insurance {
  insuranceStatus: InsuranceStatus;
  cardInsuranceNumber: string;
  insurance: string;
  versionId?: string
}

export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface AddressDataFixture {
  addressData: Address;
}

export interface AnagraphicsDataFixture {
  anagraphicsData: Anagraphics;
}

export interface InsuranceDataFixture {
  insuranceData: Insurance;
}

export interface UserFixture {
  users: ISerializedUser[];
}

export interface UserFixtureOLD {
  user: ISerializedUser;
}

export interface CaseFixture {
  cases: Case[];
}

export interface ContractFixture {
  contracts: Contract[];
}

// TODO: change with realistic payload
export interface PublicInsuranceDef {
  public_insurance_name: string;
}
export interface PrivateInsuranceDef {
  private_insurance_name: string;
}

export interface BGInsuranceDef {
  bg_insurance_name: string;
}

export type InsuranceDef = {
  version_id?: string
} & (
  | PublicInsuranceDef
  | PrivateInsuranceDef
  | BGInsuranceDef);
// END TODO ^^^^

export interface InsuranceFixture {
  available_insurances: InsuranceDef[];
}

export interface OpStandardFixture {
  opStandards: OpStandard[];
}

export interface RoleFixture {
  roles: Role[];
}

export interface RoomFixture {
  rooms: OperatingRoom[];
}

export interface InputTestCase {
  patientTab: {
    anagraphics: AnagraphicsForApi;
    address: Address;
    insurance: Insurance;
  };
  bookingTab: {
    date: Date;
    doctorName: string;
    opStandardName: string;
  };
}

export type InputTestUser = Omit<
  ISerializedUser,
  | 'id'
  | '_id'
  | 'createdAt'
  | 'updatedAt'
  | 'debtorNumber'
  | 'tenantId'
  | 'active'
  | 'roleAssociations'
> & { role_names: string[] };

export type InputRoleFixture = Omit<
  Role,
  'createdAt' | 'updatedAt' | 'tenantId' | 'id' | 'userCount'
>;
export type InputOpStandard = Omit<
  OpStandard,
  'changeRequest' | 'tenantId' | 'opStandardId'
>;
export type InputContract = Omit<
  Contract,
  'opStandards' | 'tenantId' | 'contractId' | 'details'
> & {
  opStandards: string[];
  details: Omit<Contract['details'], 'doctorId'> & {
    doctorId: { firstName: string; lastName: string };
  };
};

export interface InputTestSpec {
  cases: InputTestCase[];
  available_insurances: InsuranceDef[];
  rooms: OperatingRoom[];
  users: InputTestUser[];
  opStandards: InputOpStandard[];
  contracts: InputContract[];
  roles: InputRoleFixture[];
}

export type TestSpec = CaseFixture &
  InsuranceFixture &
  RoomFixture &
  UserFixture &
  OpStandardFixture &
  ContractFixture &
  RoleFixture;

export type TTestSpecProcessPriority<T> = { [K in keyof T]: number };

export type TransformerEntityMap<T> = {
  [K in keyof T]: (
    test: TestType<PlaywrightTestArgs & PlaywrightTestOptions & TestSpec, any>,
    testSpec: InputTestSpec,
    curr: any /* T[K] */
    // T[K] should be correct BUT it gives the error:
    // 'InsuranceDef[] | OperatingRoom[] | InputTestCase[] | InputTestUser[] | InputOpStandard[] | InputContract[] | InputRoleFixture[]'
    // is not assignable to parameter of type
    // 'InputTestCase[] & InsuranceDef[] & OperatingRoom[] & InputTestUser[] & InputContract[] & InputRoleFixture[] & InputOpStandard[]'
  ) => TestType<any, any>;
};

const defaultTestInstance = getDefaultTest()
export type DefaultTestType = typeof defaultTestInstance;

export interface EditInsuranceRequestBody {
  _id?: string;
  fromDate: string
  anagraphicFields: string[]
  rows: string[][]
}

export interface GetInsurancesResponseBody {
  _id?: string,
  status: string,
  rows?: any[][]
}
