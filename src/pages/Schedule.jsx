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

const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => {
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    return ( <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">{/* ... full modal code ... */}</div> );
};
const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    if (!isOpen) return null;
    const currentEmployeeIds = new Set(currentScheduleRows.map(r => r.EmployeeID));
    const filteredEmployees = allEmployees.filter(emp => !currentEmployeeIds.has(emp.EmployeeID) && emp.Name.toLowerCase().includes(searchTerm.toLowerCase()));
    return ( <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">{/* ... full modal code ... */}</div> );
};
const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => {
    const [clockIn, setClockIn] = useState('');
    const [clockOut, setClockOut] = useState('');
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    const handleSave = () => { if (!clockIn || !clockOut || !reason) { alert(t.fillAllFields); return; } onSave({ clockIn, clockOut, reason }); onClose(); };
    return ( <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">{/* ... full modal code ... */}</div> );
};

export const Schedule = ({ allEmployees, selectedStore, currentWeek, currentYear, currentDate, API_BASE_URL, setNotification, t, language }) => {
    const [schedule, setSchedule] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [timeAdjustmentData, setTimeAdjustmentData] = useState(null);
    const [isManagerPasscodeOpen, setIsManagerPasscodeOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    const dailyTotals = useMemo(() => {
        const totals = { sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, weekly: 0 };
        if (!schedule?.rows) return totals;
        schedule.rows.forEach(row => {
            let employeeWeeklyTotal = 0;
            DAYS_OF_WEEK.forEach(day => {
                const dayKey = day.toLowerCase();
                const shiftHours = parseShift(row.shifts?.[dayKey] || '');
                totals[dayKey] += shiftHours;
                employeeWeeklyTotal += shiftHours;
            });
            totals.weekly += employeeWeeklyTotal;
        });
        return totals;
    }, [schedule]);

    const handleDownloadPdf = () => { /* ... PDF function ... */ };

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const [scheduleRes, timeLogsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`),
                fetch(`${API_BASE_URL}/timelog/${selectedStore}/${currentWeek}/${currentYear}`)
            ]);
            if (!scheduleRes.ok || !timeLogsRes.ok) {
                console.error("Failed to fetch schedule or timelogs", { scheduleRes, timeLogsRes });
                const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                const newScheduleRows = storeEmployees.map(emp => ({ EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle, objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} }));
                setSchedule({ rows: newScheduleRows, isLocked: false });
                return;
            }
            const scheduleText = await scheduleRes.text();
            let scheduleData = scheduleText ? JSON.parse(scheduleText) : { status: 'not_found' };
            const timeLogsText = await timeLogsRes.text();
            const timeLogs = timeLogsText ? JSON.parse(timeLogsText) : [];

            if (scheduleData.status === 'not_found' || !scheduleData.rows) {
                const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                const newScheduleRows = storeEmployees.map(emp => ({ EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle, objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} }));
                scheduleData = { rows: newScheduleRows, isLocked: false };
            }
            scheduleData.rows.forEach(row => {
                const employeeLogs = timeLogs.filter(log => log.EmployeeID === row.EmployeeID);
                const dailyHours = {};
                employeeLogs.forEach(log => {
                    if (log.ClockIn && log.ClockOut) {
                        const clockInDate = new Date(log.ClockIn);
                        const clockOutDate = new Date(log.ClockOut);
                        const day = DAYS_OF_WEEK[clockInDate.getDay()].toLowerCase();
                        let duration = (clockOutDate - clockInDate) / (1000 * 60 * 60);
                        if (duration > 5) { duration -= 0.5; }
                        dailyHours[day] = (dailyHours[day] || 0) + duration;
                    }
                });
                row.actualHours = dailyHours;
            });
            const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
            const scheduleEmployeeIds = new Set(scheduleData.rows.map(r => r.EmployeeID));
            storeEmployees.forEach(emp => {
                if (!scheduleEmployeeIds.has(emp.EmployeeID)) {
                    scheduleData.rows.push({ EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle, objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} });
                }
            });
            setSchedule(scheduleData);
        } catch (error) {
            console.error("A critical error occurred while fetching schedule:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSchedule(); }, [selectedStore, currentWeek, currentYear, allEmployees]);
    
    // ... all handler functions ...

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <>
            <div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-end mb-4 gap-4 no-print">{/* ... buttons ... */}</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead>{/* ... thead ... */}</thead>
                            {/* --- TBODY WITH ERROR HANDLING FIX --- */}
                            <tbody>
                                {schedule.rows.map(row => {
                                    try {
                                        const totalScheduledHours = Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
                                        const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                                        return (
                                            <tr key={row.EmployeeID}>
                                                {/* ... all your row cells (td) ... */}
                                            </tr>
                                        )
                                    } catch (error) {
                                        console.error(`Error rendering row for employee: ${row?.Name || row?.EmployeeID}`, error);
                                        return (
                                            <tr key={row.EmployeeID} className="bg-red-900/50">
                                                <td colSpan="12" className="px-4 py-2 text-center text-white">
                                                    Error loading this row. See console for details.
                                                </td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                            <tfoot className="bg-gray-700 text-white font-bold">{/* ... tfoot with totals ... */}</tfoot>
                        </table>
                        <div className="mt-4 flex gap-4 no-print">{/* ... add buttons ... */}</div>
                    </div>
                </div>
            </div>
            {/* ... modals ... */}
        </>
    );
};
