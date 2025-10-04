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

    // --- NEW: Calculate Daily and Weekly Totals ---
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
                return shift;
            });
            const totalHoursFormatted = decimalHoursToHM(totalScheduledHours);
            return [row.Name, ...dailyCells, totalHoursFormatted];
        });

        // Create the footer row for the PDF
        const foot = [[
            { content: 'Daily Totals', styles: { fontStyle: 'bold' } },
            ...DAYS_OF_WEEK.map(day => decimalHoursToHM(dailyTotals[day.toLowerCase()])),
            { content: decimalHoursToHM(dailyTotals.weekly), styles: { fontStyle: 'bold' } }
        ]];

        doc.autoTable({
            head: head,
            body: body,
            foot: foot, // Add the footer to the PDF table
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            footStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save(`Schedule_Store-${selectedStore}_W${currentWeek}_${currentYear}.pdf`);
    };

    const fetchSchedule = async () => { /* ... your working fetch logic ... */ };
    useEffect(() => { fetchSchedule(); }, [selectedStore, currentWeek, currentYear, allEmployees]);
    
    // --- Your original handler, which is correct for editing ---
    const handleRowChange = (id, field, value, day) => {
        const newRows = schedule.rows.map(row => {
            if (row.EmployeeID === id) {
                if (day) {
                    const newFieldData = { ...row[field], [day]: value };
                    return { ...row, [field]: newFieldData };
                }
                return { ...row, [field]: value };
            }
            return row;
        });
        setSchedule(prev => ({ ...prev, rows: newRows }));
    };
    
    // ... other handler functions ...
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
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">{/* ... your table header ... */}</thead>
                            <tbody>
                                {schedule.rows.map(row => {
                                    try {
                                        const totalScheduledHours = Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
                                        const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                                        return (
                                            <tr key={row.EmployeeID}>
                                                {/* ... other <td> elements ... */}
                                                
                                                {DAYS_OF_WEEK.map((day, dayIndex) => {
                                                    const dayKey = day.toLowerCase();
                                                    const shiftValue = row.shifts?.[dayKey] || '';
                                                    return (
                                                    <td key={day} className="px-2 py-2">
                                                        <div className="flex flex-col space-y-1">
                                                            {/* --- MODIFIED: Added readOnly prop to fix editing --- */}
                                                            <input 
                                                                type="text" 
                                                                placeholder={t.shift} 
                                                                value={shiftValue} 
                                                                readOnly={schedule.isLocked}
                                                                onChange={(e) => handleRowChange(row.EmployeeID, 'shifts', e.target.value, dayKey)} 
                                                                className={`...`} 
                                                            />
                                                            {/* ... rest of the cell ... */}
                                                        </div>
                                                    </td>
                                                )})}
                                                
                                                {/* ... other <td> elements ... */}
                                            </tr>
                                        )
                                    } catch (error) { /* ... your error handling row ... */ }
                                })}
                            </tbody>
                            {/* --- NEW: On-Screen Daily Totals Footer --- */}
                            <tfoot className="bg-gray-700 text-white font-bold">
                                <tr>
                                    <td className="px-4 py-3" colSpan={4}>TOTALS</td>
                                    {DAYS_OF_WEEK.map(day => (
                                        <td key={day} className="px-2 py-3 text-center">
                                            {decimalHoursToHM(dailyTotals[day.toLowerCase()])}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center">{decimalHoursToHM(dailyTotals.weekly)}</td>
                                    <td className="px-4 py-3 print-hide"></td>
                                    <td className="px-4 py-3 no-print"></td>
                                </tr>
                            </tfoot>
                        </table>
                        <div className="mt-4 flex gap-4 no-print">{/* ... "add row" buttons ... */}</div>
                    </div>
                </div>
            </div>
            {/* ... your modals ... */}
        </>
    );
};
