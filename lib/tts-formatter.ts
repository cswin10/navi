/**
 * Format text for more natural Text-to-Speech output
 * Converts technical formats to speakable text
 */

export function formatForTTS(text: string): string {
  let formatted = text;

  // Format time ranges (e.g., "9am-11am" → "9 to 11 AM")
  formatted = formatted.replace(/(\d{1,2})(?::(\d{2}))?(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?(am|pm)/gi,
    (match, h1, m1, period1, h2, m2, period2) => {
      const time1 = m1 ? `${h1} ${m1}` : h1;
      const time2 = m2 ? `${h2} ${m2}` : h2;
      const p1 = period1.toUpperCase();
      const p2 = period2.toUpperCase();
      return p1 === p2
        ? `${time1} to ${time2} ${p2}`
        : `${time1} ${p1} to ${time2} ${p2}`;
    }
  );

  // Format standalone times (e.g., "9am" → "9 AM", "14:30" → "2:30 PM")
  formatted = formatted.replace(/\b(\d{1,2}):(\d{2})(am|pm)\b/gi, '$1 $2 $3');
  formatted = formatted.replace(/\b(\d{1,2})(am|pm)\b/gi, '$1 $3');

  // Format dates (ISO format → natural)
  formatted = formatted.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (match, year, month, day) => {
    const date = new Date(year, parseInt(month) - 1, parseInt(day));
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${parseInt(day)}, ${year}`;
  });

  // Format dates (DD/MM/YYYY → natural)
  formatted = formatted.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (match, day, month, year) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  });

  // Format numbers with context
  formatted = formatted.replace(/\b(\d+)\s+(tasks?|events?|items?|blocks?|notes?)/gi,
    (match, num, noun) => {
      return `${numberToWords(parseInt(num))} ${noun}`;
    }
  );

  // Format temperature (e.g., "18°C" → "18 degrees celsius")
  formatted = formatted.replace(/(-?\d+)°C/g, '$1 degrees celsius');
  formatted = formatted.replace(/(-?\d+)°F/g, '$1 degrees fahrenheit');

  // Format percentages (e.g., "50%" → "50 percent")
  formatted = formatted.replace(/(\d+)%/g, '$1 percent');

  // Remove excessive line breaks (newlines should be brief pauses)
  formatted = formatted.replace(/\n{3,}/g, '.\n\n'); // Multiple breaks → single break with period
  formatted = formatted.replace(/\n\n/g, '. '); // Double break → period and space
  formatted = formatted.replace(/\n/g, ', '); // Single break → comma and space

  // Clean up multiple spaces
  formatted = formatted.replace(/\s{2,}/g, ' ');

  return formatted.trim();
}

/**
 * Convert small numbers to words for more natural speech
 */
function numberToWords(num: number): string {
  if (num > 20) return num.toString(); // Keep larger numbers as digits

  const words = [
    'zero', 'one', 'two', 'three', 'four', 'five',
    'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'
  ];

  return words[num] || num.toString();
}

/**
 * Create a brief spoken summary from a detailed response
 * Used when we want to show details on screen but only speak a summary
 */
export function createSpokenSummary(intent: string, details: any): string {
  switch (intent) {
    case 'timeblock_day':
      if (details.createdEvents?.length) {
        const count = details.createdEvents.length;
        return `I've added ${numberToWords(count)} time block${count > 1 ? 's' : ''} to your calendar.`;
      }
      return 'Time blocks added to your calendar.';

    case 'add_calendar_event':
      return 'Event added to your calendar.';

    case 'create_task':
      return 'Task created.';

    case 'send_email':
      return 'Email sent.';

    case 'create_note':
      return 'Note created.';

    case 'remember':
      return 'Got it, I\'ll remember that.';

    default:
      return 'Done.';
  }
}
