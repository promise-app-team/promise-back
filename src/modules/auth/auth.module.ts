import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserController } from '../user/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController, UserController],
  providers: [AuthService, UserService, ConfigService, JwtService],
})
export class AuthModule {}
