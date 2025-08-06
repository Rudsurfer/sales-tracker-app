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
                                <p className="text-sm text-gray-400">{emp.JobTitle} - {t.homeStore}: {emp.AssociatedStore}</p>
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
            if (response.ok) {
                const data = await response.json();
                setSchedule(data);
            } else {
                const storeEmployees = allEmployees.filter(emp => emp.AssociatedStore === selectedStore);
                const newScheduleRows = storeEmployees.map(emp => ({
                    EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle,
                    objective: 0, shifts: {}, scheduledHours: {}, actualHours: {}, dailyObjectives: {}
                }));
                setSchedule({ rows: newScheduleRows, isLocked: false });
            }
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
            homeStore: employee.AssociatedStore
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

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <>
            {/* ... JSX for Schedule page ... */}
        </>
    );
};
