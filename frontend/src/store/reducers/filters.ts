import { ContractStatus, filtersSections, IPcMaterialsCasesFilters, tCasesBillingFilters, tContractsFilters, tMaterialsCasesFilters } from '@smambu/lib.constants'
import { FILTERS_ACTION } from 'store/actions'

const defaultLimit = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT
const numberedDefaultLimit = Number(defaultLimit)

export type tFiltersState = {
  [filtersSections.CASES_BILLING]: tCasesBillingFilters
  [filtersSections.CONTRACTS]: tContractsFilters
  [filtersSections.CASES_MATERIALS]: tMaterialsCasesFilters
  [filtersSections.PC_MATERIALS_CASES]: IPcMaterialsCasesFilters
}

const getInitialState = (): tFiltersState => ({
  [filtersSections.CASES_BILLING]: {
    selectedInvoicesTypes: [],
    statusFilters: [],
    selectedDoctorId: '',
    startDate: null,
    endDate: null,
    page: 0,
    limit: numberedDefaultLimit,
    sortModel: [],
  },
  [filtersSections.CONTRACTS]: {
    validFrom: null,
    validUntil: null,
    search: '',
    status: ContractStatus.All,
    doctorId: undefined,
    page: 0,
    limit: numberedDefaultLimit,
    sortModel: [],
  },
  [filtersSections.CASES_MATERIALS]: {
    selectedDoctorId: undefined,
    endDate: null,
  },
  [filtersSections.PC_MATERIALS_CASES]: {
    statusFilters: [],
    selectedDoctorId: '',
    startDate: null,
    endDate: null,
    page: 0,
    limit: numberedDefaultLimit,
    sortModel: [],
  },
})

const initialState = getInitialState()

export default function reducer (state = initialState,
  action: {
    section: filtersSections,
    type: string,
    data: any
  }): tFiltersState {
  switch (action.type) {
    case FILTERS_ACTION.SET_SECTION_FILTER:
      return {
        ...state,
        [action.section]: {
          ...state[action.section],
          ...action.data,
        }
      }
    case FILTERS_ACTION.RESET_SECTION:
      return {
        ...state,
        [action.section]: getInitialState()[action.section]
      }
    default:
      return state
  }
}
