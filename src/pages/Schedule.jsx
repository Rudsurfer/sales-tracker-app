import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, setDoc, collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { PlusCircle, Trash2, Target, X, UserPlus, Printer, Lock, Unlock } from 'lucide-react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, JOB_TITLES } from '../constants';
import { parseShift } from '../utils/helpers';

const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => {
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.dailySalesObjectivesFor.replace('{name}', row.name)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {weekDays.map((day, index) => (
                        <div key={day}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{day}</label>
                            <input 
                                type="number" 
                                value={row.dailyObjectives?.[DAYS_OF_WEEK[index].toLowerCase()] || ''} 
                                onChange={e => onRowChange(row.id, 'dailyObjectives', e.target.value, DAYS_OF_WEEK[index].toLowerCase())} 
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

    const currentEmployeeIds = new Set(currentScheduleRows.map(r => r.id));
    const filteredEmployees = allEmployees.filter(emp => 
        !currentEmployeeIds.has(emp.id) && 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                        <div key={emp.id} className="flex justify-between items-center p-2 hover:bg-gray-700 rounded">
                            <div>
                                <p className="font-bold">{emp.name}</p>
                                <p className="text-sm text-gray-400">{emp.jobTitle} - {t.homeStore}: {emp.associatedStore}</p>
                            </div>
                            <button onClick={() => { onAdd(emp); onClose(); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm">{t.addEmployee}</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const Schedule = ({ schedule, currentWeek, currentYear, db, appId, selectedStore, setNotification, t, language, allEmployees }) => {
    const [scheduleRows, setScheduleRows] = useState([]);
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [isWeekLocked, setIsWeekLocked] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        if (schedule) {
            setScheduleRows(schedule.rows || []);
            setIsWeekLocked(schedule.isLocked || false);
        }
    }, [schedule]);

    useEffect(() => {
        if (!db || !selectedStore || !currentWeek || !currentYear) return;
        const timeLogRef = collection(db, `artifacts/${appId}/public/data/time_logs`);
        const q = query(timeLogRef, where("week", "==", currentWeek), where("year", "==", currentYear));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const timeLogs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
            
            setScheduleRows(prevRows => {
                const newRows = [...prevRows];
                
                newRows.forEach(row => {
                    const employeeLogs = timeLogs.filter(log => log.employeeId === row.id);
                    const dailyHours = {};
                    
                    employeeLogs.forEach(log => {
                        if (log.clockIn && log.clockOut) {
                            const clockInDate = log.clockIn.toDate();
                            const day = DAYS_OF_WEEK[clockInDate.getDay()].toLowerCase();
                            const duration = (log.clockOut.toMillis() - log.clockIn.toMillis()) / (1000 * 60 * 60);
                            dailyHours[day] = (dailyHours[day] || 0) + duration;
                        }
                    });
                    
                    row.actualHours = dailyHours;
                });
                
                return newRows;
            });
        });

        return () => unsubscribe();

    }, [db, selectedStore, currentWeek, currentYear, appId]);

    const handleRowChange = (id, field, value, day) => {
        setScheduleRows(rows => rows.map(row => {
            if (row.id === id) {
                if(day) {
                    const newField = { ...row[field], [day]: value };
                    if (field === 'dailyObjectives') {
                        const newObjective = Object.values(newField).reduce((sum, val) => sum + (Number(val) || 0), 0);
                        return { ...row, [field]: newField, objective: newObjective };
                    }
                    return { ...row, [field]: newField };
                }
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleAddRow = () => {
        const newRow = { id: crypto.randomUUID(), name: '', employeeId: '', jobTitle: JOB_TITLES[0], objective: 0, shifts: {}, scheduledHours: {}, actualHours: {}, dailyObjectives: {} };
        setScheduleRows(rows => [...rows, newRow]);
    };
    
    const handleAddGuest = (employee) => {
        const newRow = { 
            id: employee.id, 
            name: employee.name, 
            employeeId: employee.positionId, 
            jobTitle: employee.jobTitle, 
            objective: 0, 
            shifts: {}, 
            scheduledHours: {}, 
            actualHours: {}, 
            dailyObjectives: {},
            isGuest: true,
            homeStore: employee.associatedStore
        };
        setScheduleRows(rows => [...rows, newRow]);
    };

    const handleRemoveRow = (id) => {
        setScheduleRows(rows => rows.filter(row => row.id !== id));
    };

    const executeSaveSchedule = async (lockWeek = false) => {
        if (!db) return;
        setSaveState('saving');
        const scheduleDocId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/schedules`, scheduleDocId);
        try {
            await setDoc(docRef, {
                week: currentWeek,
                year: currentYear,
                rows: scheduleRows,
                storeId: selectedStore,
                isLocked: lockWeek || isWeekLocked,
                id: scheduleDocId
            }, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.scheduleSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving schedule: ", error);
            setNotification({ message: t.errorSavingSchedule, type: 'error' });
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => executeSaveSchedule();
    
    const handleFinalizeWeek = () => {
        setIsConfirmModalOpen(true);
    };
    
    const handleConfirmFinalize = () => {
        executeSaveSchedule(true);
        setIsWeekLocked(true);
        setIsConfirmModalOpen(false);
    };

    const handlePrint = () => {
        window.print();
    };

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
                    <button onClick={handlePrint} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        <Printer size={18} className="mr-2"/> {t.printSchedule}
                    </button>
                    {isWeekLocked ? (
                        <span className="flex items-center bg-gray-700 text-green-400 font-bold py-2 px-4 rounded-lg">
                            <Lock size={18} className="mr-2"/> {t.weekLocked}
                        </span>
                    ) : (
                        <button onClick={handleFinalizeWeek} className="flex items-center bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg">
                            <Unlock size={18} className="mr-2"/> {t.finalizeWeek}
                        </button>
                    )}
                    <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.saveSchedule} />
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
                            {scheduleRows.map(row => {
                                const totalScheduledHours = Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
                                const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                                return (
                                    <tr key={row.id}>
                                        <td className="px-4 py-2 print-hide"><input type="text" placeholder="ID" value={row.employeeId || ''} onChange={e => handleRowChange(row.id, 'employeeId', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-4 py-2"><input type="text" placeholder={t.enterName} value={row.name || ''} onChange={e => handleRowChange(row.id, 'name', e.target.value)} className="w-40 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-4 py-2 print-hide">
                                            <select value={row.jobTitle} onChange={e => handleRowChange(row.id, 'jobTitle', e.target.value)} className="w-40 bg-gray-900 border border-gray-600 rounded-md px-2 py-1">
                                                {JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center space-x-2">
                                                <input type="number" placeholder={t.objective} value={row.objective || 0} readOnly className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1" />
                                                <button onClick={() => setEditingObjectivesFor(row)} className="text-blue-400 hover:text-blue-300 no-print"><Target size={18}/></button>
                                            </div>
                                        </td>
                                        {DAYS_OF_WEEK.map(day => {
                                            const dayKey = day.toLowerCase();
                                            const shiftValue = row.shifts?.[dayKey] || '';
                                            const isVacation = shiftValue.toLowerCase().startsWith('vac');
                                            const isEditing = editingCell === `${row.id}-${dayKey}`;
                                            return (
                                            <td key={day} className="px-2 py-2">
                                                <div className="flex flex-col space-y-1">
                                                    <input type="text" placeholder={t.shift} value={shiftValue} onChange={(e) => handleRowChange(row.id, 'shifts', e.target.value, dayKey)} className={`w-24 border border-gray-600 rounded-md px-2 py-1 text-center ${isVacation ? 'bg-blue-900/50' : 'bg-gray-900/70'}`} />
                                                    <input type="number" placeholder={t.sched} value={parseShift(shiftValue).toFixed(2)} readOnly className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-center print-hide" />
                                                    <input 
                                                        type="number" 
                                                        placeholder={t.actual} 
                                                        value={isEditing ? row.actualHours?.[dayKey] : (row.actualHours?.[dayKey] || 0).toFixed(2)} 
                                                        readOnly={!isEditing && !isWeekLocked}
                                                        onDoubleClick={() => !isWeekLocked && setEditingCell(`${row.id}-${dayKey}`)}
                                                        onBlur={() => setEditingCell(null)}
                                                        onChange={e => handleRowChange(row.id, 'actualHours', e.target.value, dayKey)} 
                                                        className={`w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center print-hide ${isWeekLocked ? 'bg-gray-700' : 'cursor-pointer hover:bg-gray-800'}`} 
                                                        step="0.25" 
                                                    />
                                                </div>
                                            </td>
                                        )})}
                                        <td className="px-4 py-2 text-center font-bold print-hide">{totalScheduledHours.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center font-bold print-hide">{totalActualHours.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center no-print">
                                            <button onClick={() => handleRemoveRow(row.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
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
                currentScheduleRows={scheduleRows}
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
        </>
    );
};