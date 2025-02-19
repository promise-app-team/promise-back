import { HttpStatus } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { TypedConfigService } from '@/config/env'
import { AuthController, AuthService, JwtAuthTokenService } from '@/modules/auth'
import { UserService } from '@/modules/user'
import { PrismaService } from '@/prisma'
import { createTestFixture } from '@/tests/fixtures'
import { mockJwtAuthTokenService } from '@/tests/services/mocks/jwt-token.service.mock'
import { createPrismaClient } from '@/tests/setups/prisma'

describe(AuthController, () => {
  let authController: AuthController
  const prisma = createPrismaClient({ logging: false })
  const fixture = createTestFixture(prisma, { from: 1e6, to: 2e6 })
  const validId = 1e6 - 1
  const invalidId = 1e6 - 2

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: TypedConfigService, useValue: { get() {} } },
        { provide: JwtAuthTokenService, useValue: mockJwtAuthTokenService({ validId, invalidId }) },
      ],
    }).compile()

    authController = module.get(AuthController)
  })

  test('should be defined', () => {
    expect(authController).toBeInstanceOf(AuthController)
  })

  describe(AuthController.prototype.login, () => {
    test('should return tokens when called with a valid user', async () => {
      const { input: user } = await fixture.write.user()
      await expect(authController.login(user)).resolves.toEqual({
        accessToken: 'token',
        refreshToken: 'token',
      })
    })

    test('should throw an error when unknown error occurs', async () => {
      const unknownError = fixture.input.user({ id: invalidId })
      await expect(authController.login(unknownError)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      })
    })
  })

  describe(AuthController.prototype.refreshTokens, () => {
    test('should return tokens when called with a valid token', async () => {
      await fixture.write.user({ id: validId })
      await expect(authController.refreshTokens({ refreshToken: 'valid' })).resolves.toEqual({
        accessToken: 'token',
        refreshToken: 'token',
      })
    })

    test('should throw an error when called with an expired token', async () => {
      await expect(authController.refreshTokens({ refreshToken: 'expired' })).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      })
    })

    test('should throw an error when called with an invalid token', async () => {
      return expect(authController.refreshTokens({ refreshToken: 'invalid' })).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      })
    })

    test('should throw an error when called with an not-found error', async () => {
      return expect(authController.refreshTokens({ refreshToken: 'not-found' })).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      })
    })

    test('should throw an error when called with an unknown token', async () => {
      return expect(authController.refreshTokens({ refreshToken: 'unknown' })).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      })
    })
  })
})
