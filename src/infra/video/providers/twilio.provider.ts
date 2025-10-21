import { Injectable } from '@nestjs/common';
import { env } from '@starment/config';
import { tryCatch } from '@starment/shared';
import { jwt } from 'twilio';
import { RoomInstance } from 'twilio/lib/rest/video/v1/room';

import { VideoProvider, VideoRoom, VideoToken } from '../interfaces';
import { TwilioService } from '../twilio';

@Injectable()
export class TwilioVideoProvider implements VideoProvider {
  constructor(private readonly twilioService: TwilioService) {}

  async ensureRoomExists(roomName: string): Promise<VideoRoom> {
    const { data: room, error } = await tryCatch(() =>
      this.twilioService.client.video.v1.rooms(roomName).fetch(),
    );

    if (room) {
      return this.mapRoom(room);
    }

    if (error.code === 20404) {
      const { data: created, error: createError } = await tryCatch(() =>
        this.twilioService.client.video.v1.rooms.create({
          uniqueName: roomName,
          type: 'group', // ✅ only allowed type for new accounts
        }),
      );

      if (created) {
        return this.mapRoom(created);
      }

      throw createError;
    }

    throw error;
  }

  generateAccessToken(identity: string, roomName: string): VideoToken {
    const AccessToken = jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const ttlSeconds = env().twilioTokenTtlSeconds;

    const token = new AccessToken(
      env().twilioAccountSid,
      env().twilioApiKeySid,
      env().twilioApiKeySecret,
      { identity, ttl: ttlSeconds }, // default 1h,
    );

    const grant = new VideoGrant({ room: roomName });
    token.addGrant(grant);

    return {
      token: token.toJwt(),
      identity,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000), // default 1h
    };
  }

  private mapRoom(room: RoomInstance): VideoRoom {
    return {
      id: room.sid,
      name: room.uniqueName,
      type: room.type,
      createdAt: new Date(room.dateCreated),
    };
  }
}
