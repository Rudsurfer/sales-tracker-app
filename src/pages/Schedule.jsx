// Temporarily replace your existing fetchSchedule function with this one
const fetchSchedule = async () => {
    setIsLoading(true);
    try {
        console.log("Step 1: Fetching data from API...");
        const [scheduleRes, timeLogsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`),
            fetch(`${API_BASE_URL}/timelog/${selectedStore}/${currentWeek}/${currentYear}`)
        ]);
        console.log("Step 2: API responses received.");

        let scheduleData;
        if (scheduleRes.ok) {
            scheduleData = await scheduleRes.json();
             if (scheduleData.status === 'not_found') {
                const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                const newScheduleRows = storeEmployees.map(emp => ({
                    EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle,
                    objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {}
                }));
                scheduleData = { rows: newScheduleRows, isLocked: false };
            }
        } else {
            const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
            const newScheduleRows = storeEmployees.map(emp => ({
                EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle,
                objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {}
            }));
            scheduleData = { rows: newScheduleRows, isLocked: false };
        }
        console.log("Step 3: Schedule data processed.");

        if (!timeLogsRes.ok) throw new Error(`Timelog fetch failed: ${timeLogsRes.status}`);

        const timeLogs = await timeLogsRes.json();
        console.log("Step 4: Time log data processed.");

        scheduleData.rows.forEach(row => {
            const employeeLogs = timeLogs.filter(log => log.EmployeeID === row.EmployeeID);
            const dailyHours = {};
            employeeLogs.forEach(log => {
                if (log.ClockIn && log.ClockOut) {
                    const clockInDate = new Date(log.ClockIn);
                    const clockOutDate = new Date(log.ClockOut);
                    const day = DAYS_OF_WEEK[clockInDate.getDay()].toLowerCase();
                    let duration = (clockOutDate - clockInDate) / (1000 * 60 * 60);
                    if (duration > 5) {
                        duration -= 0.5;
                    }
                    dailyHours[day] = (dailyHours[day] || 0) + duration;
                }
            });
            row.actualHours = dailyHours;
        });
        console.log("Step 5: Data merging complete.");

        const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
        const scheduleEmployeeIds = new Set(scheduleData.rows.map(r => r.EmployeeID));
        storeEmployees.forEach(emp => {
            if (!scheduleEmployeeIds.has(emp.EmployeeID)) {
                scheduleData.rows.push({
                    EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle,
                    objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {}
                });
            }
        });

        setSchedule(scheduleData);
        console.log("Step 6: Schedule state has been set successfully!");

    } catch (error) {
        console.error("--- FETCH FAILED --- The error occurred at the step before this message:", error);
    } finally {
        setIsLoading(false);
    }
};
