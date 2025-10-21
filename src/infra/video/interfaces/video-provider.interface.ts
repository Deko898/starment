import type { VideoRoom } from './video-room.interface';
import type { VideoToken } from './video-token.interface';

export interface VideoProvider {
  ensureRoomExists: (roomName: string) => Promise<VideoRoom>;
  generateAccessToken: (identity: string, roomName: string) => VideoToken;

  startRecording?: (roomId: string) => Promise<void>;
  endRecording?: (roomId: string) => Promise<void>;
  listParticipants?: (roomId: string) => Promise<string[]>;
}
