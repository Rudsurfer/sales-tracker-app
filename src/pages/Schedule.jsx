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
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [timeAdjustmentData, setTimeAdjustmentData] = useState(null);
    const [isManagerPasscodeOpen, setIsManagerPasscodeOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    const dailyTotals = useMemo(() => { /* ... */ });

    // --- PDF GENERATION ---
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
    
    // --- FETCH FUNCTION ---
    const fetchSchedule = async () => { /* ... same as yours ... */ };

    useEffect(() => { fetchSchedule(); }, [selectedStore, currentWeek, currentYear, allEmployees]);
    
    const handleRowChange = (id, field, value, day) => { /* ... */ };

    // ... other handlers ...

    if (isLoading || !schedule) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <>
            <div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-end mb-4 gap-4 no-print">
                        <button onClick={handleDownloadPdf} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            <Download size={18} className="mr-2"/> Download PDF
                        </button>
                        {/* ... other buttons ... */}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead>{/* ... thead ... */}</thead>
                            <tbody>
                                {schedule.rows.map(row => {
                                    const totalScheduledHours = Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
                                    const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                                    return (
                                        <tr key={row.EmployeeID}>
                                            {/* ... row cells ... */}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-700 text-white font-bold">{/* ... tfoot with totals ... */}</tfoot>
                        </table>

                        {/* 🔄 replaced block starts here */}
                        <div className="mt-4 flex gap-4 no-print">
                            <button onClick={handleAddRow}
                                    className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                                <PlusCircle size={20} className="mr-2" />
                                {t.addToSchedule}
                            </button>
                            <button onClick={() => setIsGuestModalOpen(true)}
                                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                                <UserPlus size={20} className="mr-2" />
                                {t.addGuestEmployee}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {editingObjectivesFor && (
                <DailyObjectiveModal
                    t={t}
                    language={language}
                    row={editingObjectivesFor}
                    onRowChange={handleRowChange}
                    onClose={() => setEditingObjectivesFor(null)}
                />
            )}
            <AddGuestAssociateModal 
                isOpen={isGuestModalOpen}
                onClose={() => setIsGuestModalOpen(false)}
                onAdd={handleAddGuest}
                allEmployees={allEmployees}
                currentScheduleRows={schedule.rows}
                t={t}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmFinalize}
                title={t.finalizeWeek}
                t={t}
            >
                <p>{t.confirmLockWeek}</p>
            </ConfirmationModal>
            {isManagerPasscodeOpen && (
                <PasscodeModal 
                    onSuccess={handleManagerPasscodeSuccess} 
                    onClose={() => setIsManagerPasscodeOpen(false)} 
                    t={t} 
                    API_BASE_URL={API_BASE_URL}
                    isManagerCheck={true}
                />
            )}
            {timeAdjustmentData && (
                <TimeAdjustmentModal 
                    isOpen={!!timeAdjustmentData}
                    onClose={() => setTimeAdjustmentData(null)}
                    onSave={handleTimeAdjustmentSave}
                    employeeName={timeAdjustmentData.row.Name}
                    day={timeAdjustmentData.day}
                    t={t}
                />
            )}
        </>
    );
};
