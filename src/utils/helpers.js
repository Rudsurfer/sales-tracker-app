// ============================================================================
// helpers.js — Common reusable utility functions
// ============================================================================

// ---------------------------------------------
// Format a number as USD currency
// ---------------------------------------------
export const formatCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '$0.00';
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// ---------------------------------------------
// Fiscal week calculation (Week 1 starts Sunday, Feb 2, 2025)
// ---------------------------------------------
export const getWeekNumber = (d) => {
  // Define fiscal-year start (UTC)
  const fiscalYearStart = new Date(Date.UTC(2025, 1, 2)); // Feb = 1 (0-indexed)

  // Normalize input date
  const date = new Date(d.valueOf());
  date.setUTCHours(0, 0, 0, 0);

  // Get the Sunday of the current week
  const dayOfWeek = date.getUTCDay(); // Sunday = 0
  const startOfWeek = new Date(date);
  startOfWeek.setUTCDate(date.getUTCDate() - dayOfWeek);

  // Align fiscal start to its own week start (Sunday)
  const fiscalStartDay = fiscalYearStart.getUTCDay();
  const fiscalStartWeek = new Date(fiscalYearStart);
  fiscalStartWeek.setUTCDate(fiscalYearStart.getUTCDate() - fiscalStartDay);

  // Calculate full week difference
  const diffMillis = startOfWeek - fiscalStartWeek;
  const diffWeeks = Math.floor(diffMillis / (1000 * 60 * 60 * 24 * 7));

  // Week 1 begins on Feb 2, 2025
  return diffWeeks + 1;
};

// ---------------------------------------------
// Convert a week number to start/end dates
// ---------------------------------------------
export const getWeekRange = (weekNumber) => {
  const fiscalYearStart = new Date(Date.UTC(2025, 1, 2)); // Feb 2, 2025
  const startOfWeek = new Date(fiscalYearStart);
  startOfWeek.setUTCDate(fiscalYearStart.getUTCDate() + (weekNumber - 1) * 7);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
  return { startOfWeek, endOfWeek };
};

// ---------------------------------------------
// Parse shift time range string into total hours
// ---------------------------------------------
export const parseShift = (shift) => {
  if (
    !shift ||
    typeof shift !== 'string' ||
    ['off', 'o', 'vac', 'vacation'].includes(shift.toLowerCase())
  ) {
    return 0;
  }

  const parts = shift.split(/[\-–]/);
  if (parts.length !== 2) return 0;

  const parseTime = (timeStr) => {
    const original = timeStr.trim();
    const isPm = original.toLowerCase().includes('pm');
    const isAm = original.toLowerCase().includes('am');
    let numericStr = original.replace(/am|pm/gi, '').trim();
    let [hours, minutes] = numericStr.split(':').map(Number);
    minutes = minutes || 0;
    if (isNaN(hours)) return null;
    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;
    return hours + minutes / 60;
  };

  let startTime = parseTime(parts[0]);
  let endTime = parseTime(parts[1]);
  if (startTime === null || endTime === null) return 0;

  // Handle cases without AM/PM explicitly given
  if (!parts[0].toLowerCase().match(/am|pm/) && !parts[1].toLowerCase().match(/am|pm/)) {
    if (endTime <= startTime && endTime < 12) endTime += 12;
    if (startTime < 7 && endTime > startTime) {
      startTime += 12;
      endTime += 12;
    }
  }

  let duration = endTime - startTime;
  if (duration < 0) duration += 24;

  // No automatic lunch deduction — handled manually in adjustments
  return duration > 0 ? duration : 0;
};
