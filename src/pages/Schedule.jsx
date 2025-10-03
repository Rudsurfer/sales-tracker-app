import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlusCircle, Trash2, Target, X, UserPlus, Printer, Lock, Unlock, Edit2 } from 'lucide-react';
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

const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => { /* ... your modal code ... */ };
const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => { /* ... your modal code ... */ };
const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => { /* ... your modal code ... */ };

export const Schedule = ({ allEmployees, selectedStore, currentWeek, currentYear, currentDate, API_BASE_URL, setNotification, t, language }) => {
    // --- DATA CHECK LOGS ---
    console.log('--- DATA CHECK ---');
    console.log('Selected Store ID:', selectedStore);
    console.log('All Employees Prop:', allEmployees);
    // -----------------------------

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

    const printStyles = `...`; // This can be removed later but is fine for now

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const [scheduleRes, timeLogsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`),
                fetch(`${API_BASE_URL}/timelog/${selectedStore}/${currentWeek}/${currentYear}`)
            ]);
            let scheduleData;
            if (scheduleRes.ok) {
                scheduleData = await scheduleRes.json();
                if (scheduleData.status === 'not_found') {
                    const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                    const newScheduleRows = storeEmployees.map(emp => ({ EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle, objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} }));
                    scheduleData = { rows: newScheduleRows, isLocked: false };
                }
            } else {
                const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                const newScheduleRows = storeEmployees.map(emp => ({ EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle, objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} }));
                scheduleData = { rows: newScheduleRows, isLocked: false };
            }
            const timeLogs = await timeLogsRes.json();
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
            const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
            const scheduleEmployeeIds = new Set(scheduleData.rows.map(r => r.EmployeeID));
            storeEmployees.forEach(emp => {
                if (!scheduleEmployeeIds.has(emp.EmployeeID)) {
                    scheduleData.rows.push({ EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle, objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} });
                }
            });
            setSchedule(scheduleData);
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSchedule(); }, [selectedStore, currentWeek, currentYear, allEmployees]);
    
    // ... all your other handler functions ...

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <>
            {/* ... your component's JSX ... */}
        </>
    );
};
