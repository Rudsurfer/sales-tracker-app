import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlusCircle, Trash2, Target, X, UserPlus, Download, Lock, Unlock, Edit2 } from 'lucide-react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { PasscodeModal } from '../components/PasscodeModal';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, JOB_TITLES } from '../constants';
import { parseShift } from '../utils/helpers';

const decimalHoursToHM = (decimalHours) => {
    if (!decimalHours || decimalHours <= 0) return "0h 0m";
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

// --- Your Original Sub-Components (Modals, etc.) ---
const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => { /* ... */ };
const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => { /* ... */ };
const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => { /* ... */ };

export const Schedule = ({ allEmployees, selectedStore, currentWeek, currentYear, currentDate, API_BASE_URL, setNotification, t, language }) => {
    const [schedule, setSchedule] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // ... other state variables ...
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [timeAdjustmentData, setTimeAdjustmentData] = useState(null);
    const [isManagerPasscodeOpen, setIsManagerPasscodeOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    const handleDownloadPdf = () => {
        if (!schedule || !schedule.rows) {
            alert("Schedule data is not available to generate a PDF.");
            return;
        }
        const doc = new window.jspdf.jsPDF('landscape');
        doc.setFontSize(14);
        doc.text(`Schedule Store ${selectedStore} - Current Week ${currentWeek}, ${currentYear}`, 40, 30);
        const head = [['Employee Name', ...weekDays, 'Total Scheduled Hours']];
        const body = schedule.rows.map(row => {
            let totalScheduledHours = 0;
            const dailyCells = DAYS_OF_WEEK.map(day => {
                const dayKey = day.toLowerCase();
                const shift = row.shifts?.[dayKey] || 'OFF';
                totalScheduledHours += parseShift(shift);
                return shift;
            });
            const totalHoursFormatted = decimalHoursToHM(totalScheduledHours);
            return [row.Name, ...dailyCells, totalHoursFormatted];
        });
        doc.autoTable({
            head: head, body: body, startY: 40, theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 }, alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        doc.save(`Schedule_Store-${selectedStore}_W${currentWeek}_${currentYear}.pdf`);
    };
    
    // --- TEMPORARY DEBUG FUNCTION ---
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

    useEffect(() => { fetchSchedule(); }, [selectedStore, currentWeek, currentYear, allEmployees]);
    const handleRowChange = (id, field, value, day) => { /* ... */ };
    const handleAddRow = () => { /* ... */ };
    const handleAddGuest = (employee) => { /* ... */ };
    const handleRemoveRow = (id) => { /* ... */ };
    const executeSaveSchedule = async (lockWeek = false) => { /* ... */ };
    const handleFinalizeWeek = () => setIsConfirmModalOpen(true);
    const handleConfirmFinalize = () => { /* ... */ };
    const handleTimeAdjustmentSave = async ({ clockIn, clockOut, reason }) => { /* ... */ };
    const handleManagerPasscodeSuccess = () => { /* ... */ };

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <>
            <div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-end mb-4 gap-4 no-print">{/* ... your buttons, including Download PDF ... */}</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">{/* ... your table header ... */}</thead>
                            <tbody>{/* ... your table body with try/catch ... */}</tbody>
                        </table>
                        <div className="mt-4 flex gap-4 no-print">{/* ... your "add row" buttons ... */}</div>
                    </div>
                </div>
            </div>
            {/* ... your modals ... */}
        </>
    );
};
