import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Target, X, UserPlus, Download, Lock, Unlock, Edit2 } from 'lucide-react'; // Changed Printer to Download
import { SaveButton, ConfirmationModal } from '../components/ui';
import { PasscodeModal } from '../components/PasscodeModal';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, JOB_TITLES } from '../constants';
import { parseShift } from '../utils/helpers';

// Helper function from your original code
const decimalHoursToHM = (decimalHours) => {
    if (!decimalHours || decimalHours <= 0) return "0h 0m";
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

// --- Your Original Sub-Components (Modals, etc.) ---
const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => { /* ... your working modal code ... */ };
const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => { /* ... your working modal code ... */ };
const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => { /* ... your working modal code ... */ };


export const Schedule = ({ allEmployees, selectedStore, currentWeek, currentYear, currentDate, API_BASE_URL, setNotification, t, language }) => {
    const [schedule, setSchedule] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // ... other state variables from your working component
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [timeAdjustmentData, setTimeAdjustmentData] = useState(null);
    const [isManagerPasscodeOpen, setIsManagerPasscodeOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    // --- NEW: Simplified PDF Generation Function ---
    const handleDownloadPdf = () => {
        if (!schedule || !schedule.rows) {
            alert("Schedule data is not available to generate a PDF.");
            return;
        }

        const doc = new window.jspdf.jsPDF('landscape'); // Use landscape for more space
        
        // 1. Add Header
        doc.setFontSize(14);
        doc.text(`Schedule Store ${selectedStore} - Current Week ${currentWeek}, ${currentYear}`, 40, 30);

        // 2. Prepare Table Data
        const head = [['Employee Name', ...weekDays, 'Total Hours']];
        const body = schedule.rows.map(row => {
            let totalScheduledHours = 0;
            const dailyCells = DAYS_OF_WEEK.map(day => {
                const dayKey = day.toLowerCase();
                const shift = row.shifts?.[dayKey] || 'OFF';
                const actual = decimalHoursToHM(row.actualHours?.[dayKey] || 0);
                
                // Add this day's scheduled hours to the row's total
                totalScheduledHours += parseShift(shift);

                return `${shift}\nActual: ${actual}`;
            });
            const totalHoursFormatted = decimalHoursToHM(totalScheduledHours);
            return [row.Name, ...dailyCells, totalHoursFormatted];
        });

        // 3. Generate Table
        doc.autoTable({
            head: head,
            body: body,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        // 4. Save PDF
        doc.save(`Schedule_Store-${selectedStore}_W${currentWeek}_${currentYear}.pdf`);
    };

    // --- Your original working functions (fetchSchedule, handlers, etc.) ---
    const fetchSchedule = async () => { /* ... your working fetch logic ... */ };
    useEffect(() => { fetchSchedule(); }, [selectedStore, currentWeek, currentYear, allEmployees]);
    const handleRowChange = (id, field, value, day) => { /* ... your working logic ... */ };
    const handleAddRow = () => { /* ... your working logic ... */ };
    const handleAddGuest = (employee) => { /* ... your working logic ... */ };
    const handleRemoveRow = (id) => { /* ... your working logic ... */ };
    const executeSaveSchedule = async (lockWeek = false) => { /* ... your working logic ... */ };
    const handleFinalizeWeek = () => setIsConfirmModalOpen(true);
    const handleConfirmFinalize = () => { /* ... your working logic ... */ };
    const handleTimeAdjustmentSave = async ({ clockIn, clockOut, reason }) => { /* ... your working logic ... */ };
    const handleManagerPasscodeSuccess = () => { /* ... your working logic ... */ };
    

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <>
            {/* The old <style> tag for CSS printing is removed */}
            <div id="schedule-container"> {/* The old "printable-schedule" id is removed */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-end mb-4 gap-4">
                        {/* --- MODIFIED: This is now a PDF Download Button --- */}
                        <button onClick={handleDownloadPdf} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            <Download size={18} className="mr-2"/> Download PDF
                        </button>
                        {/* The rest of your buttons remain the same */}
                        {schedule.isLocked ? (
                            <span className="flex items-center bg-gray-700 text-green-400 font-bold py-2 px-4 rounded-lg">
                                <Lock size={18} className="mr-2"/> {t.weekLocked}
                            </span>
                        ) : (
                            <button onClick={handleFinalizeWeek} className="flex items-center bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg">
                                <Unlock size={18} className="mr-2"/> {t.finalizeWeek}
                            </button>
                        )}
                        <SaveButton onClick={() => executeSaveSchedule()} saveState={saveState} text={t.saveSchedule} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            {/* ... your original working table ... */}
                            <thead>{/* ... */}</thead>
                            <tbody>{/* ... */}</tbody>
                        </table>
                        <div className="mt-4 flex gap-4">
                            {/* ... your original working "add row" buttons ... */}
                        </div>
                    </div>
                </div>
            </div>
            {/* ... your original working modals ... */}
        </>
    );
};
