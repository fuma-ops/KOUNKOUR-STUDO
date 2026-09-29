import { Contest, Language } from '../types';

/**
 * Generates an .ics file string and triggers a download for Apple Calendar / Outlook / Android
 */
export function downloadContestIcs(contest: Contest, language: Language = 'fr'): void {
  const title = contest.title[language] || contest.title.fr;
  const admin = contest.administration.name[language] || contest.administration.name.fr;
  const description = `Concours officiel: ${title}\\nAdministration: ${admin}\\nRéf: ${contest.referenceCode}\\nDépôt sur: ${contest.officialSourceUrl}`;
  
  // Approximate a date from the contest date or 14 days from now if text
  const now = new Date();
  const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KounKour//Morocco Concours Portal//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:kounkour-${contest.id}@kounkour.ma`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:📅 Concours: ${title.replace(/,/g, '')}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${contest.region[language] || 'Maroc'}`,
    `URL:${contest.officialSourceUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P2D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Rappel: Date limite concours ${contest.referenceCode}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Concours_${contest.referenceCode.replace('/', '_')}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct Google Calendar web URL
 */
export function getGoogleCalendarUrl(contest: Contest, language: Language = 'fr'): string {
  const title = encodeURIComponent(`📅 Concours ${contest.referenceCode} - ${contest.title[language] || contest.title.fr}`);
  const details = encodeURIComponent(
    `Concours Officiel Fonction Publique Maroc\nAdministration : ${contest.administration.name[language]}\nGrade : ${contest.grade || contest.degreeLevel}\nDate Limite de Dépôt : ${contest.deadlineDate}\nLien Officiel : ${contest.officialSourceUrl}`
  );
  const location = encodeURIComponent(contest.region[language] || 'Maroc');
  
  // Format for Google Calendar (default 7 days ahead for deadline reminder)
  const now = new Date();
  const startDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 1 * 60 * 60 * 1000);
  
  const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
  const dates = `${formatGCal(startDate)}/${formatGCal(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
}
