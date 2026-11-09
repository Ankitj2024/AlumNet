export interface IcsEventOptions {
  sessionId: string;
  topic: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timeZone?: string;
  meetingLink?: string;
  organizerName?: string;
  organizerEmail?: string;
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateIcsContent(options: IcsEventOptions): string {
  const {
    sessionId,
    topic,
    description,
    startTime,
    endTime,
    meetingLink,
    organizerName,
    organizerEmail,
  } = options;

  const nowFormatted = formatIcsDate(new Date());
  const startFormatted = formatIcsDate(startTime);
  const endFormatted = formatIcsDate(endTime);

  const fullDescription = `${description || 'Institutional Alumni Mentorship Session'}\n\nJoin Meeting: ${meetingLink || 'TBD'}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AlumNet//P11 Mentorship Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:p11-session-${sessionId}@alumni.edu`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${escapeIcsText(`P11 Mentorship: ${topic}`)}`,
    `DESCRIPTION:${escapeIcsText(fullDescription)}`,
    `LOCATION:${escapeIcsText(meetingLink || 'Google Meet')}`,
    'STATUS:CONFIRMED',
    organizerEmail
      ? `ORGANIZER;CN=${escapeIcsText(organizerName || 'Mentor')}:mailto:${organizerEmail}`
      : undefined,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Mentorship session starting in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}
