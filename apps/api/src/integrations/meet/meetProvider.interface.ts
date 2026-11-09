export interface CreateMeetingParams {
  topic: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  organizerEmail?: string;
  attendeeEmail?: string;
}

export interface MeetingResult {
  provider: 'google' | 'mock';
  meetingLink: string;
  meetingId: string;
  conferenceDetails?: any;
}

export interface MeetProvider {
  createMeeting(params: CreateMeetingParams): Promise<MeetingResult>;
  cancelMeeting(meetingId: string): Promise<boolean>;
}
