import { createParamDecorator, ExecutionContext } from '@nestjs/common'
export * from './permissions.decorator'

export const PermissionsDec = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const permissions = request.permissions

    return data ? permissions?.[data] : permissions
  },
)
