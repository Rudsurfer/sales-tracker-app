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
    return ( <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">{/* ... modal content ... */}</div> );
};
const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    if (!isOpen) return null;
    const currentEmployeeIds = new Set(currentScheduleRows.map(r => r.EmployeeID));
    const filteredEmployees = allEmployees.filter(emp => !currentEmployeeIds.has(emp.EmployeeID) && emp.Name.toLowerCase().includes(searchTerm.toLowerCase()));
    return ( <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">{/* ... modal content ... */}</div> );
};
const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => {
    const [clockIn, setClockIn] = useState('');
    const [clockOut, setClockOut] = useState('');
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    const handleSave = () => { if (!clockIn || !clockOut || !reason) { alert(t.fillAllFields); return; } onSave({ clockIn, clockOut, reason }); onClose(); };
    return ( <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">{/* ... modal content ... */}</div> );
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

    const handleDownloadPdf = () => {
        // ... your PDF function from the baseline code ...
    };

    const fetchSchedule = async () => {
        // ... fetch function from your baseline code ...
    };

    useEffect(() => { fetchSchedule(); }, [selectedStore, currentWeek, currentYear, allEmployees]);
    
    // --- FIX: Restored function to allow typing in shift boxes ---
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

    // --- FIX: Restored handler functions ---
    const handleAddRow = () => {
        const newRow = { EmployeeID: `new_${Date.now()}`, Name: '', PositionID: '', JobTitle: JOB_TITLES[0], objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} };
        setSchedule(prev => ({...prev, rows: [...prev.rows, newRow]}));
    };
    const handleAddGuest = (employee) => {
        const newRow = { EmployeeID: employee.EmployeeID, Name: employee.Name, PositionID: employee.PositionID, JobTitle: employee.JobTitle, objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {}, isGuest: true, homeStore: employee.StoreID };
        setSchedule(prev => ({...prev, rows: [...prev.rows, newRow]}));
    };
    const handleRemoveRow = (id) => {
        setSchedule(prev => ({...prev, rows: prev.rows.filter(row => row.EmployeeID !== id)}));
    };
    const executeSaveSchedule = async (lockWeek = false) => { /* ... full implementation ... */ };
    const handleFinalizeWeek = () => setIsConfirmModalOpen(true);
    const handleConfirmFinalize = () => { /* ... full implementation ... */ };
    const handleTimeAdjustmentSave = async ({ clockIn, clockOut, reason }) => { /* ... full implementation ... */ };
    const handleManagerPasscodeSuccess = () => { /* ... full implementation ... */ };


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
                        {schedule.isLocked ? ( <span className="flex items-center bg-gray-700 text-green-400 font-bold py-2 px-4 rounded-lg"><Lock size={18} className="mr-2"/> {t.weekLocked}</span> ) : ( <button onClick={handleFinalizeWeek} className="flex items-center bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg"><Unlock size={18} className="mr-2"/> {t.finalizeWeek}</button> )}
                        <SaveButton onClick={() => executeSaveSchedule()} saveState={saveState} text={t.saveSchedule} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3 align-top print-hide">{t.employeeId}</th>
                                    <th scope="col" className="px-4 py-3 align-top">{t.employeeName}</th>
                                    <th scope="col" className="px-4 py-3 align-top print-hide">{t.jobTitleDescription}</th>
                                    <th scope="col" className="px-4 py-3 align-top">{t.salesObjective}</th>
                                    {weekDays.map(day => <th key={day} scope="col" className="px-2 py-3 text-center">{day}</th>)}
                                    {/* --- FIX: Restored Scheduled Hours Column Header --- */}
                                    <th scope="col" className="px-4 py-3 align-top">{t.totalSchedHrs}</th>
                                    <th scope="col" className="px-4 py-3 align-top print-hide">{t.totalActualHrs}</th>
                                    <th scope="col" className="px-4 py-3 align-top no-print">{t.actions}</th>
                                </tr>
                            </thead>
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
                                                            <input 
                                                                type="number" 
                                                                value={row.actualHours?.[dayKey] || ''} 
                                                                onBlur={() => setEditingCell(null)}
                                                                onChange={e => handleRowChange(row.EmployeeID, 'actualHours', e.target.value, dayKey)} 
                                                                autoFocus
                                                                className={`w-24 bg-gray-900 border border-blue-500 rounded-md px-2 py-1 text-center print-hide`} 
                                                                step="0.25" 
                                                            />
                                                        ) : (
                                                            <div 
                                                                onDoubleClick={() => !schedule.isLocked && setEditingCell(`${row.EmployeeID}-${dayKey}`)}
                                                                className={`w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center print-hide ${schedule.isLocked ? 'bg-gray-700' : 'cursor-pointer hover:bg-gray-800'}`}
                                                            >
                                                                {decimalHoursToHM(row.actualHours?.[dayKey] || 0)}
                                                            </div>
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
                        </table>
                        {/* --- FIX: Restored Add Buttons --- */}
                        <div className="mt-4 flex gap-4 no-print">
                            <button onClick={handleAddRow} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                                <PlusCircle size={20} className="mr-2" />
                                {t.addToSchedule}
                            </button>
                            <button onClick={() => setIsGuestModalOpen(true)} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                                <UserPlus size={20} className="mr-2" />
                                {t.addGuestEmployee}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* ... your modals ... */}
        </>
    );
};

