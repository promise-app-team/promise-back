import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from '@/app/app.controller';
import { CommonModule } from '@/common/modules/common.module';
import { TypedConfigService, extraEnv } from '@/config/env';
import { schema } from '@/config/validation';
import { CacheModule, InMemoryCacheService, RedisCacheService } from '@/customs/cache';
import { LoggerModule } from '@/customs/logger/logger.module';
import { LoggerService } from '@/customs/logger/logger.service';
import { TypedConfigModule } from '@/customs/typed-config/typed-config.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { EventModule } from '@/modules/event/event.module';
import { PromiseModule } from '@/modules/promise/promise.module';
import { FileUploadModule } from '@/modules/upload/upload.module';
import { UserModule } from '@/modules/user/user.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    TypedConfigModule.register({
      isGlobal: true,
      load: [extraEnv],
      envFilePath: ['.env.local'],
      validationSchema: schema,
      expandVariables: true,
      config: TypedConfigService,
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [TypedConfigService],
      useFactory(config: TypedConfigService) {
        return {
          secret: config.get('jwt.secret'),
        };
      },
    }),
    LoggerModule.registerAsync({
      isGlobal: true,
      inject: [TypedConfigService],
      useFactory(config: TypedConfigService) {
        return {
          filter({ metadata }) {
            const label = metadata.label;

            switch (config.get('stage')) {
              case 'test':
                return false;
              case 'local':
              // return true;
              case 'dev':
              case 'prod':
                if (
                  [
                    'NestApplication',
                    'EventGateway',
                    'NestFactory',
                    'InstanceLoader',
                    'RoutesResolver',
                    'RouterExplorer',
                    'WebSocketsController',
                  ].includes(label)
                ) {
                  return false;
                }
            }

            return true;
          },
        };
      },
    }),
    PrismaModule.registerAsync({
      isGlobal: true,
      inject: [LoggerService, TypedConfigService],
      useFactory(logger: LoggerService, config: TypedConfigService) {
        return {
          log: [
            { level: 'info', emit: 'event' },
            { level: 'query', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
          ],
          errorFormat: config.get('colorize') ? 'pretty' : 'colorless',
          transform(prisma) {
            const tableName = config.get('db.name');
            prisma.$on('query', ({ query, params, duration }) => {
              const sanitizedQuery = query
                .replace(/^SELECT\s+(.*?)\s+FROM/, 'SELECT * FROM')
                .replace(new RegExp(`\`${tableName}[._a-z]+?\`\.`, 'g'), '')
                .replace(/\((?<table>`.+?`).(?<field>`.+?`)\)/g, '$<table>.$<field>');

              const _params = JSON.parse(params);
              const injectedQuery = sanitizedQuery.replace(/\?/g, () => {
                const value = _params.shift();
                if (typeof value === 'string') {
                  return `'${value}'`;
                }
                return value;
              });

              logger.log(`${injectedQuery}`, {
                label: 'Query',
                ms: duration,
              });
            });
            return prisma;
          },
        };
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [TypedConfigService],
      useFactory(config: TypedConfigService) {
        return {
          service: config.get('is.test')
            ? new InMemoryCacheService()
            : new RedisCacheService({
                host: config.get('redis.host'),
                port: config.get('redis.port'),
                password: config.get('redis.password'),
              }),
        };
      },
    }),
    AuthModule,
    UserModule,
    EventModule,
    PromiseModule,
    FileUploadModule,
    CommonModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
