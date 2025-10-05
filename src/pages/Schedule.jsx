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

    // --- YOUR PDF GENERATION FUNCTION ---
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
    
    // --- ROBUST FETCH FUNCTION ---
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
            let scheduleData = await scheduleRes.json();
            const timeLogs = await timeLogsRes.json();
            if (scheduleData.status === 'not_found') {
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

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
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
                                            <td className="px-4 py-2 print-hide"><input type="text" placeholder="ID" value={row.PositionID || ''} readOnly className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1" /></td>
                                            <td className="px-4 py-2"><input type="text" placeholder={t.enterName} value={row.Name || ''} readOnly className="w-40 bg-gray-700 border border-gray-600 rounded-md px-2 py-1" /></td>
                                            <td className="px-4 py-2 print-hide">
                                                <select value={row.JobTitle} readOnly className="w-40 bg-gray-700 border border-gray-600 rounded-md px-2 py-1">
                                                    {JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center space-x-2">
                                                    <input type="number" placeholder={t.objective} value={row.objective || 0} readOnly className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1" />
                                                    <button onClick={() => setEditingObjectivesFor(row)} className="text-blue-400 hover:text-blue-300 no-print"><Target size={18}/></button>
                                                </div>
                                            </td>
                                            {DAYS_OF_WEEK.map((day, dayIndex) => {
                                                const dayKey = day.toLowerCase();
                                                const shiftValue = row.shifts?.[dayKey] || '';
                                                const isVacation = shiftValue.toLowerCase().startsWith('vac');
                                                const isEditing = editingCell === `${row.EmployeeID}-${dayKey}`;
                                                return (
                                                <td key={day} className="px-2 py-2">
                                                    <div className="flex flex-col space-y-1">
                                                        <input type="text" placeholder={t.shift} value={shiftValue} onChange={(e) => handleRowChange(row.EmployeeID, 'shifts', e.target.value, dayKey)} className={`w-24 border border-gray-600 rounded-md px-2 py-1 text-center ${isVacation ? 'bg-blue-900/50' : 'bg-gray-900/70'}`} />
                                                        <input type="number" placeholder={t.sched} value={parseShift(shiftValue).toFixed(2)} readOnly className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-center print-hide" />
                                                        <div className="relative">
                                                            {isEditing ? (
                                                                <input type="number" value={row.actualHours?.[dayKey] || ''} onBlur={() => setEditingCell(null)} onChange={e => handleRowChange(row.EmployeeID, 'actualHours', e.target.value, dayKey)} autoFocus className={`w-24 bg-gray-900 border border-blue-500 rounded-md px-2 py-1 text-center print-hide`} step="0.25" />
                                                            ) : (
                                                                <div onDoubleClick={() => !schedule.isLocked && setEditingCell(`${row.EmployeeID}-${dayKey}`)} className={`w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center print-hide ${schedule.isLocked ? 'bg-gray-700' : 'cursor-pointer hover:bg-gray-800'}`}>{decimalHoursToHM(row.actualHours?.[dayKey] || 0)}</div>
                                                            )}
                                                            {!schedule.isLocked && !isEditing && <button onClick={() => { setTimeAdjustmentData({row, dayIndex, day: weekDays[dayIndex]}); setIsManagerPasscodeOpen(true); }} className="absolute right-0 top-0 h-full px-1 text-gray-500 hover:text-white no-print"><Edit2 size={12}/></button>}
                                                        </div>
                                                    </div>
                                                </td>
                                            )})}
                                            <td className="px-4 py-2 text-center font-bold print-hide">{decimalHoursToHM(totalScheduledHours)}</td>
                                            <td className="px-4 py-2 text-center font-bold print-hide">{decimalHoursToHM(totalActualHours)}</td>
                                            <td className="px-4 py-2 text-center no-print">
                                                <button onClick={() => handleRemoveRow(row.EmployeeID)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot className="bg-gray-700 text-white font-bold">{/* ... tfoot with totals ... */}</tfoot>
                        </table>
                        {/* --- THIS IS THE SECTION YOU PROVIDED --- */}
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
                {editingObjectivesFor && <DailyObjectiveModal t={t} language={language} row={editingObjectivesFor} onRowChange={handleRowChange} onClose={() => setEditingObjectivesFor(null)} />}
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
            </div>
        </>
    );
};

