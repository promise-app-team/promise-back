import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs'

import { IntHashService } from '@/customs/inthash'

@Injectable()
export class EncodePromiseID implements NestInterceptor {
  constructor(private readonly hasher: IntHashService) {}

  #transform(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.#transform(item))
    }

    if (data && 'id' in data) {
      data = { pid: this.hasher.encode(data.id), ...data }
      delete data.id
    }

    return data
  }

  intercept(_context: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(map(this.#transform.bind(this)))
  }
}
