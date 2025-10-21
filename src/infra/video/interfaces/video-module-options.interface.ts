export interface VideoCredentials {
  accountSid: string;
  authToken?: string;
  apiKeySid?: string;
  apiKeySecret?: string;
}
export interface VideoModuleOptions {
  provider: 'twilio' | 'unknown'; // Later we can add: | 'webrtc'
  credentials: VideoCredentials;
}
