// This file contains reusable helper functions used in various parts of the application.

export const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '$0.00';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// UPDATED FISCAL WEEK CALCULATION
export const getWeekNumber = (d) => {
    const fiscalYearStart = new Date(Date.UTC(2025, 1, 2)); // Month is 0-indexed, so 1 is February.

    const date = new Date(d.valueOf());
    date.setUTCHours(0, 0, 0, 0); // Use UTC to prevent timezone shifts from affecting the date.

    // Calculate the start of the week (Sunday) for the given date.
    const dayOfWeek = date.getUTCDay(); // Sunday = 0, Monday = 1, ...
    const startOfWeek = new Date(date);
    startOfWeek.setUTCDate(date.getUTCDate() - dayOfWeek);

    // Calculate the difference in milliseconds between the start of the current week and the fiscal year start.
    const diffMillis = startOfWeek - fiscalYearStart;

    // Convert the difference to days, then to weeks.
    // We add 1 because the first week is Week 1, not Week 0.
    const diffWeeks = Math.floor(diffMillis / (1000 * 60 * 60 * 24 * 7));
    
    return diffWeeks + 1;
};


export const parseShift = (shift) => {
    if (!shift || typeof shift !== 'string' || shift.toLowerCase() === 'off' || shift.toLowerCase() === 'o' || shift.toLowerCase() === 'vac' || shift.toLowerCase() === 'vacation') {
        return 0;
    }
    const parts = shift.split(/[\-–]/);
    if (parts.length !== 2) return 0;

    const parseTime = (timeStr) => {
        const originalTimeStr = timeStr.trim();
        const isPm = originalTimeStr.toLowerCase().includes('pm');
        const isAm = originalTimeStr.toLowerCase().includes('am');
        let numericStr = originalTimeStr.replace(/am|pm/gi, '').trim();
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

    if (!parts[0].toLowerCase().match(/am|pm/) && !parts[1].toLowerCase().match(/am|pm/)) {
       if (endTime <= startTime && endTime < 12) endTime += 12;
       if (startTime < 7 && endTime > startTime) {
           startTime += 12;
           endTime += 12;
       }
    }

    let duration = endTime - startTime;
    if (duration < 0) duration += 24;
    if (duration > 5) duration -= 1;
    return duration > 0 ? duration : 0;
};
