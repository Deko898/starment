import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule, Params } from 'nestjs-pino';
import { pino } from 'pino';

export interface StarmentLoggerOptions {
  level?: string;
  pretty?: boolean;
}

@Module({})
export class StarmentLoggerModule {
  static forRoot(opts: StarmentLoggerOptions = {}): DynamicModule {
    const isProd = process.env.NODE_ENV === 'production';
    const level = opts.level ?? process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

    const logger = pino({
      level,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'password',
          '*.password',
        ],
        remove: true,
      },
      transport: !isProd
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              singleLine: false,
              messageFormat: '{msg}',
            },
          }
        : undefined,
    });

    const params: Params = {
      pinoHttp: {
        logger,
        genReqId: (req) => req.headers['x-request-id'] ?? crypto.randomUUID(),
        customAttributeKeys: {
          req: 'httpRequest',
          res: 'httpResponse',
          err: 'error',
          responseTime: 'responseTime',
        },
      },
    };

    return {
      module: StarmentLoggerModule,
      imports: [LoggerModule.forRoot(params)],
      exports: [LoggerModule],
    };
  }
}
