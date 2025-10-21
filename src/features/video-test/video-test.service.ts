import { Inject, Injectable } from '@nestjs/common';
import { VIDEO_PROVIDER, type VideoProvider, VideoRoom } from '@starment/video';

@Injectable()
export class VideoTestService {
  constructor(@Inject(VIDEO_PROVIDER) private readonly video: VideoProvider) {}

  async createRoom(
    roomName: string,
    identity: string,
  ): Promise<{ room: VideoRoom; token: string }> {
    const room = await this.video.ensureRoomExists(roomName);
    const token = this.video.generateAccessToken(identity, roomName);
    return { room, token: token.token };
  }
}
