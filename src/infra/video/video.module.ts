import { DynamicModule, Module, Provider } from '@nestjs/common';

import { VideoModuleOptions } from './interfaces';
import { TwilioVideoProvider, VIDEO_PROVIDER } from './providers';
import { TwilioModule } from './twilio';
import { ConfigurableModuleClass } from './utils';

@Module({})
export class VideoModule extends ConfigurableModuleClass {
  static forRoot(options: VideoModuleOptions): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    if (options.provider === 'twilio') {
      imports.push(
        TwilioModule.forRoot({
          accountSid: options.credentials.accountSid,
          authToken: options.credentials.authToken,
          apiKeySid: options.credentials.apiKeySid,
          apiKeySecret: options.credentials.apiKeySecret,
        }),
      );

      providers.push({
        provide: VIDEO_PROVIDER,
        useClass: TwilioVideoProvider,
      });
    }

    return {
      module: VideoModule,
      imports,
      providers,
      exports: [VIDEO_PROVIDER],
    };
  }
}
