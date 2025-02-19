import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Request, Response } from 'express'
import { map } from 'rxjs'

import { LoggerService } from '@/customs/logger'
import { JwtAuthTokenService } from '@/modules/auth'
import { PrismaService } from '@/prisma'
import { guard } from '@/utils'

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
const EXCLUDE_PATHS = ['/event/', '/promises/queue']
const REDACTED_KEYS = ['accessToken', 'refreshToken']

function redact(obj: Record<string, any>, keys: string[], mask = '[REDACTED]'): Record<string, any> {
  const newObj = { ...obj }
  for (const key of keys) {
    if (newObj[key]) Reflect.set(newObj, key, mask)
  }
  return newObj
}

@Injectable()
export class MutationLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly jwt: JwtAuthTokenService,
  ) {
    logger.setContext(MutationLogInterceptor.name)
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()
    const requestBody = request.body
    const requestTime = Date.now()

    if (!MUTATION_METHODS.includes(request.method)) {
      return next.handle()
    }

    if (EXCLUDE_PATHS.some(path => request.url.includes(path))) {
      return next.handle()
    }

    return next.handle().pipe(
      map(async (responseBody: any) => {
        const duration = Date.now() - requestTime

        let userId = null
        userId ||= guard(() => this.jwt.verifyAccessToken(responseBody.accessToken).sub, null)
        userId ||= guard(() => (request as any).user.id, null)
        if (!userId) return responseBody

        await this.prisma.mutationLog
          .createMany({
            data: {
              userId,
              url: request.url,
              method: request.method,
              headers: redact(request.headers, ['authorization']),
              statusCode: response.statusCode,
              requestBody: Object.keys(requestBody).length ? redact(requestBody, REDACTED_KEYS) : undefined,
              responseBody: Object.keys(responseBody).length ? redact(responseBody, REDACTED_KEYS) : undefined,
              duration,
            },
          })
          .catch(error => this.logger.error(error))

        return responseBody
      }),
    )
  }
}
