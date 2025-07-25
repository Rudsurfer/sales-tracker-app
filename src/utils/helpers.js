export const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '$0.00';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export const getWeekNumber = (d) => {
    const date = new Date(d.valueOf());
    date.setHours(0, 0, 0, 0);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const firstDayOfWeek = firstDayOfYear.getDay();
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfWeek + 1) / 7);
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