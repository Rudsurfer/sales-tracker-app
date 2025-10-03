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
const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => { /* ... your modal code ... */ };
const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => { /* ... your modal code ... */ };
const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => { /* ... your modal code ... */ };

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

    // --- MODIFIED: PDF Generation Function ---
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
                // This line is changed to only return the shift
                return shift;
            });
            const totalHoursFormatted = decimalHoursToHM(totalScheduledHours);
            return [row.Name, ...dailyCells, totalHoursFormatted];
        });

        doc.autoTable({
            head: head,
            body: body,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save(`Schedule_Store-${selectedStore}_W${currentWeek}_${currentYear}.pdf`);
    };

    // --- Your original working functions (fetchSchedule, handlers, etc.) ---
    const fetchSchedule = async () => { /* ... your working fetch logic ... */ };
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
                    <div className="flex justify-end mb-4 gap-4 no-print">{/* ... your buttons ... */}</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3 align-top print-hide">{t.employeeId}</th>
                                    <th scope="col" className="px-4 py-3 align-top">{t.employeeName}</th>
                                    <th scope="col" className="px-4 py-3 align-top print-hide">{t.jobTitleDescription}</th>
                                    <th scope="col" className="px-4 py-3 align-top">{t.salesObjective}</th>
                                    {weekDays.map(day => <th key={day} scope="col" className="px-2 py-3 text-center">{day}</th>)}
                                    {/* --- RESTORED: On-Screen Scheduled Hours Column Header --- */}
                                    <th scope="col" className="px-4 py-3 align-top">{t.totalSchedHrs}</th>
                                    <th scope="col" className="px-4 py-3 align-top print-hide">{t.totalActualHrs}</th>
                                    <th scope="col" className="px-4 py-3 align-top no-print">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.rows.map(row => {
                                    try {
                                        const totalScheduledHours = Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
                                        const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                                        return (
                                            <tr key={row.EmployeeID}>
                                                {/* ... your other <td> elements ... */}
                                                
                                                {/* This maps over the days of the week */}
                                                {DAYS_OF_WEEK.map((day, dayIndex) => { /* ... */ })}

                                                {/* --- RESTORED: On-Screen Scheduled Hours Column Data --- */}
                                                <td className="px-4 py-2 text-center font-bold">{decimalHoursToHM(totalScheduledHours)}</td>
                                                <td className="px-4 py-2 text-center font-bold print-hide">{decimalHoursToHM(totalActualHours)}</td>
                                                <td className="px-4 py-2 text-center no-print">
                                                    <button onClick={() => handleRemoveRow(row.EmployeeID)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                                </td>
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
                        </table>
                        <div className="mt-4 flex gap-4 no-print">{/* ... your "add row" buttons ... */}</div>
                    </div>
                </div>
            </div>
            {/* ... your modals ... */}
        </>
    );
};
