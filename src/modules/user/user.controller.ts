import { Body, Controller } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { HttpException } from '@/common/exceptions'
import { Delete, Get, Put } from '@/customs/nest'
import { UserModel } from '@/prisma'

import { AuthUser } from '../auth/auth.decorator'

import { InputDeleteUserDTO, InputUpdateUserDTO, OutputDeleteUserDTO, UserDTO } from './user.dto'
import { UserService, UserServiceError } from './user.service'

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile', { auth: true, description: '로그인한 사용자 정보를 불러옵니다.' })
  async getMyProfile<User extends UserModel>(@AuthUser() user: User): Promise<UserDTO> {
    return UserDTO.from(user)
  }

  @Put('profile', { auth: true, description: '로그인한 사용자 정보를 수정합니다.' })
  async updateMyProfile<User extends Pick<UserModel, 'id'>>(
    @AuthUser() user: User,
    @Body() body: InputUpdateUserDTO,
  ): Promise<UserDTO> {
    return this.userService
      .update(user.id, body)
      .then(user => UserDTO.from(user))
      .catch((error) => {
        switch (error) {
          case UserServiceError.NotFoundUser:
            throw HttpException.new(error, 'NOT_FOUND')
          default:
            throw HttpException.new(error)
        }
      })
  }

  @Delete('profile', { auth: true, description: '로그인한 사용자 정보를 삭제합니다.' })
  async deleteMyProfile<User extends Pick<UserModel, 'id'>>(
    @AuthUser() user: User,
    @Body() body: InputDeleteUserDTO,
  ): Promise<OutputDeleteUserDTO> {
    return this.userService
      .delete(user.id, body.reason)
      .then(user => OutputDeleteUserDTO.from(user))
      .catch((error) => {
        switch (error) {
          case UserServiceError.NotFoundUser:
            throw HttpException.new(error, 'NOT_FOUND')
          default:
            throw HttpException.new(error)
        }
      })
  }
}
