import crypto from 'crypto';
import { MeetProvider, CreateMeetingParams, MeetingResult } from './meetProvider.interface.js';
import { logger } from '../../config/logger.js';

export class MockMeetProvider implements MeetProvider {
  async createMeeting(params: CreateMeetingParams): Promise<MeetingResult> {
    const meetingCode = `${crypto.randomBytes(3).toString('hex')}-${crypto.randomBytes(3).toString('hex')}`;
    const meetingLink = `https://meet.google.com/${meetingCode}`;

    logger.info(
      `[MockMeetProvider] Created mock Google Meet session: ${meetingLink} for topic "${params.topic}" (${params.timeZone})`
    );

    return {
      provider: 'mock',
      meetingLink,
      meetingId: meetingCode,
      conferenceDetails: {
        conferenceSolution: {
          name: 'Google Meet',
          iconUri: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png',
        },
        conferenceId: meetingCode,
      },
    };
  }

  async cancelMeeting(meetingId: string): Promise<boolean> {
    logger.info(`[MockMeetProvider] Cancelled meeting ${meetingId}`);
    return true;
  }
}
