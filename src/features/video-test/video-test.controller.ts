import { Body, Controller, Post } from '@nestjs/common';
import { VideoRoom } from '@starment/video';

import { VideoTestService } from './video-test.service';

@Controller({ path: 'video-test', version: '1' })
export class VideoTestController {
  constructor(private readonly videoService: VideoTestService) {}

  @Post('join-room')
  async join(
    @Body() body: { roomName: string; identity: string },
  ): Promise<{ room: VideoRoom; token: string }> {
    return this.videoService.createRoom(body.roomName, body.identity);
  }
}
