import { Module } from '@nestjs/common';
import { env } from '@starment/config';
import { VideoModule } from '@starment/video';

import { VideoTestController } from './video-test.controller';
import { VideoTestService } from './video-test.service';

@Module({
  imports: [
    VideoModule.forRoot({
      provider: 'twilio',
      credentials: {
        accountSid: env().twilioAccountSid,
        apiKeySid: env().twilioApiKeySid,
        apiKeySecret: env().twilioApiKeySecret,
      },
    }),
  ],
  providers: [VideoTestService],
  controllers: [VideoTestController],
})
export class VideoTestModule {}
