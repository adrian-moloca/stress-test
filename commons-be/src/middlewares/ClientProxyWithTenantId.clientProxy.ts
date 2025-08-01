import { ClientTCP } from '@nestjs/microservices'
import { Observable } from 'rxjs'

export class ClientProxyWithTenantId extends ClientTCP {
  send (pattern: any, data: any): Observable<any> {
    if (data.tenantId !== undefined) return super.send(pattern, data)

    const tenantId = global.als.getStore()?.tenantId

    const dataWithTenantId = { ...data, tenantId }

    return super.send(pattern, dataWithTenantId)
  }
}
