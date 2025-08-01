import { IUser } from '../types'
import { NaiveDate } from '../types/global'
import { ITenant } from '../types/tenants'
export class CreateUserDto {
  public firstname!: string
  public lastname!: string
  public isVerified!: boolean
  public email!: string
  public phoneNumber!: number
  public roleAssociations!: string[]
  public birthDate: NaiveDate | null = null
}

export class EditUserDto {
  public firstname!: string
  public lastname!: string
  public isVerified!: boolean
  public email!: string
  public phoneNumber!: number
  public roleAssociations!: string[]
  public active!: boolean
  public birthDate: NaiveDate | null = null
}

export class GetUsersQueryDto {
  public search?: string
}

export class GetCurrentUserResponseDto {
  user!: IUser
  tenant!: ITenant
}
