import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlusCircle, Trash2, Target, X, UserPlus, Printer, Lock, Unlock, Edit2 } from 'lucide-react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, JOB_TITLES } from '../constants';
import { parseShift } from '../utils/helpers';

const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => {
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.dailySalesObjectivesFor.replace('{name}', row.Name)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {weekDays.map((day, index) => (
                        <div key={day}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{day}</label>
                            <input
                                type="number"
                                value={row.dailyObjectives?.[DAYS_OF_WEEK[index].toLowerCase()] || ''}
                                onChange={e => onRowChange(row.EmployeeID, 'dailyObjectives', e.target.value, DAYS_OF_WEEK[index].toLowerCase())}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
                            />
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.done}</button>
                </div>
            </div>
        </div>
    );
};

const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    if (!isOpen) return null;

    const currentEmployeeIds = new Set(currentScheduleRows.map(r => r.EmployeeID));
    const filteredEmployees = allEmployees.filter(emp =>
        !currentEmployeeIds.has(emp.EmployeeID) &&
        emp.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.addGuestEmployee}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <input
                    type="text"
                    placeholder={t.searchEmployee}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 mb-4"
                />
                <div className="max-h-80 overflow-y-auto">
                    {filteredEmployees.map(emp => (
                        <div key={emp.EmployeeID} className="flex justify-between items-center p-2 hover:bg-gray-700 rounded">
                            <div>
                                <p className="font-bold">{emp.Name}</p>
                                <p className="text-sm text-gray-400">{emp.JobTitle} - {t.homeStore}: {emp.StoreID}</p>
                            </div>
                            <button onClick={() => { onAdd(emp); onClose(); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm">{t.addEmployee}</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => {
    const [clockIn, setClockIn] = useState('');
    const [clockOut, setClockOut] = useState('');
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!clockIn || !clockOut || !reason) {
            alert(t.fillAllFields);
            return;
        }
        onSave({ clockIn, clockOut, reason });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Time Adjustment for {employeeName} on {day}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Clock In Time (e.g., 9:00am)</label>
                        <input type="text" value={clockIn} onChange={e => setClockIn(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Clock Out Time (e.g., 5:30pm)</label>
                        <input type="text" value={clockOut} onChange={e => setClockOut(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Reason for Adjustment</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" rows="3"></textarea>
                    </div>
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">{t.cancel}</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.saveChanges}</button>
                </div>
            </div>
        </div>
    );
};

export const Schedule = ({ allEmployees, selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, language }) => {
    const [schedule, setSchedule] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [timeAdjustmentData, setTimeAdjustmentData] = useState(null);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`);
            let scheduleData;
            if (response.ok) {
                scheduleData = await response.json();
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

        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [selectedStore, currentWeek, currentYear, allEmployees]);
    
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

    const handleAddRow = () => {
        const newRow = { EmployeeID: `new_${Date.now()}`, Name: '', PositionID: '', JobTitle: JOB_TITLES[0], objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {} };
        setSchedule(prev => ({...prev, rows: [...prev.rows, newRow]}));
    };

    const handleAddGuest = (employee) => {
        const newRow = { 
            EmployeeID: employee.EmployeeID, 
            Name: employee.Name, 
            PositionID: employee.PositionID, 
            JobTitle: employee.JobTitle, 
            objective: 0, 
            shifts: {}, 
            actualHours: {}, 
            dailyObjectives: {},
            isGuest: true,
            homeStore: employee.StoreID
        };
        setSchedule(prev => ({...prev, rows: [...prev.rows, newRow]}));
    };

    const handleRemoveRow = (id) => {
        setSchedule(prev => ({...prev, rows: prev.rows.filter(row => row.EmployeeID !== id)}));
    };

    const executeSaveSchedule = async (lockWeek = false) => {
        setSaveState('saving');
        try {
            await fetch(`${API_BASE_URL}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: selectedStore,
                    week: currentWeek,
                    year: currentYear,
                    isLocked: lockWeek || schedule.isLocked,
                    rows: schedule.rows
                })
            });
            setSaveState('saved');
            setNotification({ message: t.scheduleSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving schedule:", error);
            setNotification({ message: t.errorSavingSchedule, type: 'error' });
            setSaveState('idle');
        }
        setIsConfirmModalOpen(false);
    };
    
    const handleFinalizeWeek = () => setIsConfirmModalOpen(true);
    const handleConfirmFinalize = () => {
        executeSaveSchedule(true);
        setSchedule(prev => ({...prev, isLocked: true}));
        setIsConfirmModalOpen(false);
    };

    const handleTimeAdjustmentSave = async ({ clockIn, clockOut, reason }) => {
        if (!timeAdjustmentData) return;
        const { row, dayIndex } = timeAdjustmentData;
        
        const date = new Date(currentYear, 0, 1 + (currentWeek - 1) * 7);
        date.setDate(date.getDate() - date.getDay() + dayIndex);

        const parseTime = (timeStr) => {
            const isPm = timeStr.toLowerCase().includes('pm');
            const isAm = timeStr.toLowerCase().includes('am');
            let [hours, minutes] = timeStr.replace(/am|pm/gi, '').trim().split(':').map(Number);
            minutes = minutes || 0;
            if (isPm && hours < 12) hours += 12;
            if (isAm && hours === 12) hours = 0;
            return { hours, minutes };
        };

        const { hours: inHours, minutes: inMinutes } = parseTime(clockIn);
        const { hours: outHours, minutes: outMinutes } = parseTime(clockOut);

        const clockInDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), inHours, inMinutes);
        const clockOutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), outHours, outMinutes);

        try {
            await fetch(`${API_BASE_URL}/timelog/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: row.EmployeeID,
                    storeId: selectedStore,
                    clockIn: clockInDate.toISOString(),
                    clockOut: clockOutDate.toISOString(),
                    week: currentWeek,
                    year: currentYear,
                    reason: reason,
                })
            });
            setNotification({ message: "Time adjustment saved.", type: 'success' });
            fetchSchedule(); // Re-fetch schedule to update actual hours
        } catch (error) {
            console.error("Error saving time adjustment:", error);
            setNotification({ message: "Error saving adjustment.", type: 'error' });
        }
    };

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-schedule, #printable-schedule * { visibility: visible; }
                    #printable-schedule { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                }
            `}</style>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-end mb-4 gap-4 no-print">
                    <button onClick={() => window.print()} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        <Printer size={18} className="mr-2"/> {t.printSchedule}
                    </button>
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
                <div id="printable-schedule" className="overflow-x-auto">
                    <h2 className="text-xl font-bold mb-4 print-only">{t.schedule} - {t.store} {selectedStore} - {t.currentWeek} {currentWeek}, {currentYear}</h2>
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 align-top print-hide">{t.employeeId}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.employeeName}</th>
                                <th scope="col" className="px-4 py-3 align-top print-hide">{t.jobTitleDescription}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.salesObjective}</th>
                                {weekDays.map(day => <th key={day} scope="col" className="px-2 py-3 text-center">{day}</th>)}
                                <th scope="col" className="px-4 py-3 align-top print-hide">{t.totalSchedHrs}</th>
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
                                                        <input 
                                                            type="number" 
                                                            placeholder={t.actual} 
                                                            value={isEditing ? row.actualHours?.[dayKey] : (row.actualHours?.[dayKey] || 0).toFixed(2)} 
                                                            readOnly={!isEditing || schedule.isLocked}
                                                            onDoubleClick={() => !schedule.isLocked && setEditingCell(`${row.EmployeeID}-${dayKey}`)}
                                                            onBlur={() => setEditingCell(null)}
                                                            onChange={e => handleRowChange(row.EmployeeID, 'actualHours', e.target.value, dayKey)} 
                                                            className={`w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center print-hide ${schedule.isLocked ? 'bg-gray-700' : 'cursor-pointer hover:bg-gray-800'}`} 
                                                            step="0.25" 
                                                        />
                                                        {!schedule.isLocked && <button onClick={() => setTimeAdjustmentData({row, dayIndex, day: weekDays[dayIndex]})} className="absolute right-0 top-0 h-full px-1 text-gray-500 hover:text-white no-print"><Edit2 size={12}/></button>}
                                                    </div>
                                                </div>
                                            </td>
                                        )})}
                                        <td className="px-4 py-2 text-center font-bold print-hide">{totalScheduledHours.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center font-bold print-hide">{totalActualHours.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center no-print">
                                            <button onClick={() => handleRemoveRow(row.EmployeeID)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
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