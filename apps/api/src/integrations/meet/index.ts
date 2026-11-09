import { env } from '@p11/config';
import { MeetProvider } from './meetProvider.interface.js';
import { MockMeetProvider } from './mockMeetProvider.js';
import { GoogleCalendarMeetProvider } from './googleMeetProvider.js';

export * from './meetProvider.interface.js';
export * from './mockMeetProvider.js';
export * from './googleMeetProvider.js';

export function getMeetProvider(): MeetProvider {
  if (env.MEET_PROVIDER === 'google') {
    return new GoogleCalendarMeetProvider();
  }
  return new MockMeetProvider();
}

export const meetProvider = getMeetProvider();
