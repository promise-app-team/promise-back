import { PickType } from '@nestjs/swagger'
import { pick } from 'remeda'

import type { Type } from '@nestjs/common'

export function ApplyDTO<T, K extends keyof T, A extends Record<string, any>>(
  classRef: Type<T>,
  keys: readonly K[] | K[],
  extend?: (obj: T & Record<string, any>) => A,
): Type<Pick<T, (typeof keys)[number]>> & { from: (obj: Record<string, any>) => Pick<T, K> & A } {
  return class DTO extends (PickType(classRef, keys) as Type) {
    static from(obj: any) {
      if (!obj) throw new Error('obj is missing')

      const dto = new DTO()
      const picked = pick(obj, keys)
      const extended = extend?.(obj) ?? {}
      return Object.assign(dto, picked, extended)
    }
  } as any
}
