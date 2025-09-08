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

const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => {
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.dailyObjectivesFor} {row.Name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DAYS_OF_WEEK.map((day, index) => (
                        <div key={day}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{weekDays[index]}</label>
                            <input
                                type="number"
                                value={row.shifts[day]?.objective || ''}
                                onChange={e => onRowChange(row.EmployeeID, 'shifts', { ...row.shifts, [day]: { ...row.shifts[day], objective: e.target.value } })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
                                placeholder="$"
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
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    const availableEmployees = allEmployees.filter(emp => 
        !currentScheduleRows.some(row => row.EmployeeID === emp.EmployeeID)
    );

    const handleAdd = () => {
        if (selectedEmployeeId) {
            onAdd(parseInt(selectedEmployeeId, 10));
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md">
                 <h3 className="text-xl font-bold text-white mb-4">{t.addGuestAssociate}</h3>
                 <select onChange={e => setSelectedEmployeeId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 mb-4">
                    <option value="">{t.selectEmployee}</option>
                    {availableEmployees.map(emp => <option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.Name} ({emp.StoreID})</option>)}
                 </select>
                 <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">{t.cancel}</button>
                    <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.add}</button>
                 </div>
            </div>
        </div>
    )
};

const TimeAdjustmentModal = ({ isOpen, onClose, onSave, employeeName, day, t }) => {
    const [clockIn, setClockIn] = useState('');
    const [clockOut, setClockOut] = useState('');

    const handleSave = () => {
        onSave(day, clockIn, clockOut);
        onClose();
    };
    
    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md">
                 <h3 className="text-xl font-bold text-white mb-4">{t.adjustTimeFor} {employeeName} on {day}</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400">{t.clockIn}</label>
                        <input type="datetime-local" value={clockIn} onChange={e => setClockIn(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 mt-1" />
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">{t.clockOut}</label>
                        <input type="datetime-local" value={clockOut} onChange={e => setClockOut(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 mt-1" />
                    </div>
                 </div>
                 <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">{t.cancel}</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.save}</button>
                 </div>
            </div>
        </div>
    );
};

export const Schedule = ({ allEmployees, selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, language }) => {
    const [schedule, setSchedule] = useState({ rows: [], isLocked: false });
    const [isLoading, setIsLoading] = useState(true);
    const [saveState, setSaveState] = useState('idle');
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isManagerPasscodeOpen, setIsManagerPasscodeOpen] = useState(false);
    const [timeAdjustmentData, setTimeAdjustmentData] = useState(null);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    const printRef = useRef();

    useEffect(() => {
        const fetchSchedule = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`);
                if (response.ok) {
                    const data = await response.json();
                     if (data.status === 'not_found') {
                        const homeStoreEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                        setSchedule({ 
                            rows: homeStoreEmployees.map(e => ({...e, shifts: {}, actualHours: {}})),
                            isLocked: false
                        });
                    } else {
                        setSchedule(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching schedule:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTimeLogs = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/timelog/${selectedStore}/${currentWeek}/${currentYear}`);
                if (response.ok) {
                    const timeLogs = await response.json();
                    
                    setSchedule(currentSchedule => {
                        const newRows = currentSchedule.rows.map(row => {
                            const employeeLogs = timeLogs.filter(log => log.EmployeeID === row.EmployeeID && log.ClockIn && log.ClockOut);
                            const actualHoursByDay = {};
                            
                            employeeLogs.forEach(log => {
                                const clockInDate = new Date(log.ClockIn);
                                const dayName = clockInDate.toLocaleDateString('en-US', { weekday: 'long' });
                                const duration = (new Date(log.ClockOut) - clockInDate) / (1000 * 60 * 60);
                                actualHoursByDay[dayName] = (actualHoursByDay[dayName] || 0) + duration;
                            });

                            return { ...row, actualHours: actualHoursByDay };
                        });
                        return { ...currentSchedule, rows: newRows };
                    });
                }
            } catch (error) {
                 console.error("Error fetching time logs:", error);
            }
        };

        fetchSchedule().then(() => {
            if (!schedule.isLocked) {
                fetchTimeLogs();
            }
        });

    }, [selectedStore, currentWeek, currentYear, API_BASE_URL, allEmployees]);

    const handleRowChange = (id, field, value) => {
        setSchedule(s => ({
            ...s,
            rows: s.rows.map(row => (row.EmployeeID === id ? { ...row, [field]: value } : row))
        }));
    };

    const handleSave = async (isFinalizing = false) => {
        if(schedule.isLocked) return;
        setSaveState('saving');
        try {
            await fetch(`${API_BASE_URL}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: selectedStore,
                    week: currentWeek,
                    year: currentYear,
                    rows: schedule.rows,
                    isLocked: isFinalizing
                })
            });
            setSaveState('saved');
            if(isFinalizing) {
                 setSchedule(s => ({...s, isLocked: true }));
                 setNotification({ message: t.scheduleFinalized, type: 'success' });
            } else {
                setNotification({ message: t.scheduleSaved, type: 'success' });
            }
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving schedule:", error);
            setNotification({ message: t.errorSavingSchedule, type: 'error' });
            setSaveState('idle');
        }
    };
    
    const handleAddGuest = (employeeId) => {
        const employeeToAdd = allEmployees.find(e => e.EmployeeID === employeeId);
        if(employeeToAdd) {
            setSchedule(s => ({...s, rows: [...s.rows, {...employeeToAdd, shifts: {}, actualHours: {}}] }));
        }
    };

    const handleRemoveRow = (id) => {
         setSchedule(s => ({...s, rows: s.rows.filter(row => row.EmployeeID !== id)}));
    };
    
    const handlePrint = () => window.print();

    const handleFinalizeClick = () => {
        if(!schedule.isLocked) {
            setIsManagerPasscodeOpen(true);
        }
    };

    const handleManagerPasscodeSuccess = () => {
        setIsManagerPasscodeOpen(false);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmFinalize = () => {
        setIsConfirmModalOpen(false);
        handleSave(true);
    };

    const handleTimeAdjustmentSave = async (day, clockIn, clockOut) => {
        const { row } = timeAdjustmentData;
        try {
            await fetch(`${API_BASE_URL}/timelog/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: row.EmployeeID,
                    storeId: selectedStore,
                    week: currentWeek,
                    year: currentYear,
                    clockIn,
                    clockOut
                })
            });
            setNotification({ message: t.timeAdjustedSuccess, type: 'success' });
            setTimeAdjustmentData(null);
        } catch (error) {
            setNotification({ message: t.errorAdjustingTime, type: 'error' });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }
    
    return (
        <>
            <div className="space-y-6" ref={printRef}>
                 <div className="flex justify-between items-center no-print">
                    <div className="flex items-center gap-4">
                        <button onClick={handleFinalizeClick} disabled={schedule.isLocked} className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                           {schedule.isLocked ? <Lock size={18} className="mr-2" /> : <Unlock size={18} className="mr-2" />}
                           {schedule.isLocked ? t.finalized : t.finalizeWeek}
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsGuestModalOpen(true)} disabled={schedule.isLocked} className="flex items-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                            <UserPlus size={18} className="mr-2"/> {t.addGuestAssociate}
                        </button>
                        <button onClick={handlePrint} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"><Printer size={18} className="mr-2" /> {t.print}</button>
                        <SaveButton onClick={() => handleSave(false)} saveState={saveState} text={t.saveSchedule} />
                    </div>
                </div>
                <div className="overflow-x-auto bg-gray-800 p-4 rounded-lg shadow-lg">
                    <table className="w-full text-sm text-left text-gray-400">
                         <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">{t.associate}</th>
                                {weekDays.map(day => <th key={day} className="px-4 py-3 text-center">{day}</th>)}
                                <th className="px-4 py-3 text-center">{t.totalHours}</th>
                                <th className="px-4 py-3 text-center no-print">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.rows?.map(row => {
                                const { totalScheduled, totalActual } = Object.values(row.shifts || {}).reduce(
                                    (acc, shift) => {
                                        acc.totalScheduled += shift.duration || 0;
                                        return acc;
                                    }, { totalScheduled: 0, totalActual: 0 }
                                );
                                const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + h, 0);

                                return (
                                    <tr key={row.EmployeeID} className="bg-gray-800 border-b border-gray-700">
                                        <td className="px-4 py-2 font-medium text-white">{row.Name} <span className="text-xs text-gray-500">({row.JobTitle})</span></td>
                                        {DAYS_OF_WEEK.map(day => (
                                            <td key={day} className="px-1 py-1 align-top">
                                                <input
                                                    type="text"
                                                    value={row.shifts[day]?.raw || ''}
                                                    onChange={e => handleRowChange(row.EmployeeID, 'shifts', { ...row.shifts, [day]: parseShift(e.target.value) })}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center"
                                                    placeholder="e.g. 9-5"
                                                    disabled={schedule.isLocked}
                                                />
                                                <div className="text-xs text-center mt-1">
                                                    <span className="text-blue-400">{decimalHoursToHM(row.shifts[day]?.duration)}</span>
                                                    {row.actualHours?.[day] && <span className="text-green-400 ml-2">{decimalHoursToHM(row.actualHours[day])}</span>}
                                                </div>
                                                 {schedule.isLocked && <button onClick={() => setTimeAdjustmentData({row, day})} className="text-yellow-500 hover:text-yellow-400 text-xs w-full mt-1"><Edit2 size={12} className="inline mr-1"/>{t.adjust}</button>}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-center font-bold">
                                            <div className="text-blue-400">{decimalHoursToHM(totalScheduled)}</div>
                                            <div className="text-green-40oL">{decimalHoursToHM(totalActualHours)}</div>
                                        </td>
                                        <td className="px-4 py-2 text-center no-print">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setEditingObjectivesFor(row)} className="text-yellow-500 hover:text-yellow-400"><Target size={18}/></button>
                                                {!schedule.isLocked && <button onClick={() => handleRemoveRow(row.EmployeeID)} className="text-red-500 hover:text-red-400"><Trash2 size={18}/></button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {editingObjectivesFor && <DailyObjectiveModal row={editingObjectivesFor} onRowChange={handleRowChange} onClose={() => setEditingObjectivesFor(null)} t={t} language={language}/>}
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
