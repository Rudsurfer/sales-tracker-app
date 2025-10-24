// src/pages/schedule.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Trash2, Target, X, UserPlus, Download, Lock, Unlock, Edit2 } from 'lucide-react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { PasscodeModal } from '../components/PasscodeModal';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, JOB_TITLES } from '../constants';
import { parseShift } from '../utils/helpers';

/* ---------------------- helpers ---------------------- */
const decimalHoursToHM = (decimalHours) => {
    if (!decimalHours || decimalHours <= 0) return "0h 0m";
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

/* compute total hours from four timestamps in ISO format (strings) */
const computeHoursFromFour = ({ ClockInAM, ClockOutLunch, ClockInLunch, ClockOutPM }) => {
    let total = 0;
    if (ClockInAM && ClockOutLunch) {
        total += (new Date(ClockOutLunch) - new Date(ClockInAM)) / (1000 * 60 * 60);
    }
    if (ClockInLunch && ClockOutPM) {
        total += (new Date(ClockOutPM) - new Date(ClockInLunch)) / (1000 * 60 * 60);
    }
    // guard negative or NaN
    if (!isFinite(total) || total < 0) return 0;
    return total;
};

/* pick the "best"/latest log for a day by max timestamp across fields */
const pickLatestLogForGroup = (logs) => {
    if (!logs || logs.length === 0) return null;
    let best = logs[0];
    const maxTime = (log) => {
        const times = [];
        ['ClockInAM','ClockOutLunch','ClockInLunch','ClockOutPM','ClockIn','ClockOut'].forEach(k => {
            if (log[k]) {
                const t = Date.parse(log[k]);
                if (!isNaN(t)) times.push(t);
            }
        });
        return times.length ? Math.max(...times) : 0;
    };
    let bestTime = maxTime(best);
    for (let i = 1; i < logs.length; i++) {
        const mt = maxTime(logs[i]);
        if (mt > bestTime) {
            best = logs[i];
            bestTime = mt;
        }
    }
    return best;
};

/* ---------------------- Modals ---------------------- */

const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => {
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 no-print">
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
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 no-print">
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
    const [clockInAM, setClockInAM] = useState('');
    const [clockOutLunch, setClockOutLunch] = useState('');
    const [clockInLunch, setClockInLunch] = useState('');
    const [clockOutPM, setClockOutPM] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setClockInAM(''); setClockOutLunch(''); setClockInLunch(''); setClockOutPM(''); setReason('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        // allow partial entries but at least one timestamp required
        if (!clockInAM && !clockOutLunch && !clockInLunch && !clockOutPM) {
            alert(t.fillAllFields || "Please enter at least one timestamp.");
            return;
        }
        onSave({ clockInAM, clockOutLunch, clockInLunch, clockOutPM, reason });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 no-print">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.timeAdjustmentFor || 'Time Adjustment'} {employeeName} ({day})</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Clock In (Start of Day)</label>
                        <input type="text" value={clockInAM} onChange={e => setClockInAM(e.target.value)} placeholder="9:00am" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Clock Out (Lunch)</label>
                        <input type="text" value={clockOutLunch} onChange={e => setClockOutLunch(e.target.value)} placeholder="12:30pm" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Clock In (After Lunch)</label>
                        <input type="text" value={clockInLunch} onChange={e => setClockInLunch(e.target.value)} placeholder="1:00pm" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Clock Out (End of Day)</label>
                        <input type="text" value={clockOutPM} onChange={e => setClockOutPM(e.target.value)} placeholder="5:00pm" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
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

/* ---------------------- Main Schedule component ---------------------- */

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

    /* ---------------------- fetchSchedule ---------------------- */
    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const [scheduleRes, timeLogsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`),
                fetch(`${API_BASE_URL}/timelog/${selectedStore}/${currentWeek}/${currentYear}`)
            ]);

            let scheduleData;
            if (scheduleRes.ok) {
                const data = await scheduleRes.json();
                if (data.status === 'not_found' || !data.rows) {
                    const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                    const newScheduleRows = storeEmployees.map(emp => ({
                        EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle,
                        objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {}
                    }));
                    scheduleData = { rows: newScheduleRows, isLocked: false };
                } else {
                    scheduleData = data;
                }
            } else {
                const storeEmployees = allEmployees.filter(emp => emp.StoreID === selectedStore);
                const newScheduleRows = storeEmployees.map(emp => ({
                    EmployeeID: emp.EmployeeID, Name: emp.Name, PositionID: emp.PositionID, JobTitle: emp.JobTitle,
                    objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {}
                }));
                scheduleData = { rows: newScheduleRows, isLocked: false };
            }
            
            const timeLogs = timeLogsRes.ok ? await timeLogsRes.json() : [];

            // Build actualHours: group logs by EmployeeID and by day key
            const logsByEmployee = {};
            (timeLogs || []).forEach(log => {
                const empId = log.EmployeeID;
                if (!empId) return;
                // determine dayKey - prefer explicit Day, otherwise infer from available timestamps
                let dayKey = null;
                if (log.Day) {
                    dayKey = String(log.Day).toLowerCase();
                } else {
                    const sampleTs = log.ClockInAM || log.ClockIn || log.ClockOutLunch || log.ClockInLunch || log.ClockOut || log.ClockOutPM;
                    if (sampleTs) {
                        const d = new Date(sampleTs);
                        dayKey = DAYS_OF_WEEK[d.getUTCDay()].toLowerCase();
                    }
                }
                if (!dayKey) return;
                logsByEmployee[empId] = logsByEmployee[empId] || {};
                logsByEmployee[empId][dayKey] = logsByEmployee[empId][dayKey] || [];
                logsByEmployee[empId][dayKey].push(log);
            });

            // For each schedule row, compute daily actualHours by picking latest log for that employee/day and computing hours
            scheduleData.rows.forEach(row => {
                const empLogs = logsByEmployee[row.EmployeeID] || {};
                const dailyHours = {};
                Object.keys(empLogs).forEach(dayKey => {
                    const chosen = pickLatestLogForGroup(empLogs[dayKey]);
                    if (!chosen) return;
                    // Support both old format (ClockIn / ClockOut) and new 4-field format
                    if (chosen.ClockInAM || chosen.ClockOutLunch || chosen.ClockInLunch || chosen.ClockOutPM) {
                        dailyHours[dayKey] = computeHoursFromFour(chosen);
                    } else if (chosen.ClockIn && chosen.ClockOut) {
                        // fallback single pair - no 30min deduction
                        const ci = Date.parse(chosen.ClockIn);
                        const co = Date.parse(chosen.ClockOut);
                        if (!isNaN(ci) && !isNaN(co) && co > ci) {
                            dailyHours[dayKey] = (co - ci) / (1000 * 60 * 60);
                        } else {
                            dailyHours[dayKey] = 0;
                        }
                    } else {
                        dailyHours[dayKey] = 0;
                    }
                });
                row.actualHours = dailyHours;
            });

            // ensure store employees present
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
            setSchedule({rows: [], isLocked: false}); // Set a default state on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if(selectedStore && allEmployees.length > 0){
            fetchSchedule();
        }
    }, [selectedStore, currentWeek, currentYear, allEmployees]);

    /* ---------------------- row handlers ---------------------- */
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
                    isLocked: lockWeek || (schedule && schedule.isLocked),
                    rows: schedule.rows
                })
            });
            setSaveState('saved');
            setNotification({ message: t.scheduleSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
            if(lockWeek) fetchSchedule();
        } catch (error) {
            console.error("Error saving schedule:", error);
            setNotification({ message: t.errorSavingSchedule, type: 'error' });
            setSaveState('idle');
        }
        setIsConfirmModalOpen(false);
    };

    /* ---------------------- finalize/week ---------------------- */
    const handleFinalizeWeek = () => setIsConfirmModalOpen(true);
    const handleConfirmFinalize = () => {
        executeSaveSchedule(true);
    };

    /* ---------------------- Time adjustments (overwrite logic) ---------------------- */
    const parseTimeToDate = (timeStr, baseDate) => {
        if (!timeStr) return null;
        const isPm = timeStr.toLowerCase().includes('pm');
        const isAm = timeStr.toLowerCase().includes('am');
        let [hours, minutes] = timeStr.replace(/am|pm/gi, '').trim().split(':').map(n => Number(n));
        minutes = minutes || 0;
        if (isNaN(hours)) return null;
        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
        return new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes));
    };

    const handleTimeAdjustmentSave = async ({ clockInAM, clockOutLunch, clockInLunch, clockOutPM, reason }) => {
        if (!timeAdjustmentData) return;
        const { row, dayIndex } = timeAdjustmentData;

        // compute base date (weekStart + dayIndex)
        const weekStartDate = new Date(currentDate);
        const currentDayOfWeek = weekStartDate.getUTCDay();
        weekStartDate.setUTCDate(weekStartDate.getUTCDate() - currentDayOfWeek + dayIndex);

        // parse times into ISO strings (if provided)
        const ciAM = parseTimeToDate(clockInAM, weekStartDate);
        const coLunch = parseTimeToDate(clockOutLunch, weekStartDate);
        const ciLunch = parseTimeToDate(clockInLunch, weekStartDate);
        const coPM = parseTimeToDate(clockOutPM, weekStartDate);

        // Build payload - send to /timelog/adjust (keeps existing API)
        try {
            await fetch(`${API_BASE_URL}/timelog/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: row.EmployeeID,
                    storeId: selectedStore,
                    week: currentWeek,
                    year: currentYear,
                    dayIndex,
                    ClockInAM: ciAM ? ciAM.toISOString() : null,
                    ClockOutLunch: coLunch ? coLunch.toISOString() : null,
                    ClockInLunch: ciLunch ? ciLunch.toISOString() : null,
                    ClockOutPM: coPM ? coPM.toISOString() : null,
                    notes: reason
                })
            });

            // Overwrite local schedule.actualHours for that day (no stacking)
            const dayKey = DAYS_OF_WEEK[dayIndex].toLowerCase();
            const newRows = (schedule.rows || []).map(r => {
                if (r.EmployeeID !== row.EmployeeID) return r;
                const newActualHours = { ...(r.actualHours || {}) };
                newActualHours[dayKey] = computeHoursFromFour({
                    ClockInAM: ciAM ? ciAM.toISOString() : null,
                    ClockOutLunch: coLunch ? coLunch.toISOString() : null,
                    ClockInLunch: ciLunch ? ciLunch.toISOString() : null,
                    ClockOutPM: coPM ? coPM.toISOString() : null
                });
                return { ...r, actualHours: newActualHours };
            });
            setSchedule(prev => ({ ...prev, rows: newRows }));

            setNotification({ message: t.timeAdjustmentSaved || 'Time adjustment saved.', type: 'success' });
            fetchSchedule(); // refresh from server to guarantee consistency
        } catch (error) {
            console.error("Error saving time adjustment:", error);
            setNotification({ message: t.errorSavingAdjustment || 'Error saving adjustment.', type: 'error' });
        }
    };

    const handleManagerPasscodeSuccess = () => {
        setIsManagerPasscodeOpen(false);
        setTimeAdjustmentData(prev => ({...prev, authorized: true }));
    };

    /* ---------------------- PDF (unchanged behavior but kept) ---------------------- */
    const handleDownloadPdf = () => {
        const { jsPDF } = window.jspdf || {};
        // if jspdf not available, warn
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('PDF library not loaded.');
            return;
        }
        const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const options = { month: 'short', day: 'numeric' };
        const locale = language === 'fr' ? 'fr-CA' : 'en-US';
        const dateRange = `${startOfWeek.toLocaleDateString(locale, options)} - ${endOfWeek.toLocaleDateString(locale, options)}`;
    
        let totalScheduledHoursWeek = 0;
        (schedule?.rows || []).forEach(row => {
            totalScheduledHoursWeek += Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
        });
    
        const head = [[
            { content: t.employeeName, styles: { fillColor: [41, 41, 41], textColor: 255, fontStyle: 'bold' } },
            ...weekDays.map(day => ({ content: day, styles: { fillColor: [41, 41, 41], textColor: 255, fontStyle: 'bold', halign: 'center' } })),
            { content: t.totalSchedHrs, styles: { fillColor: [41, 41, 41], textColor: 255, fontStyle: 'bold', halign: 'center' } }
        ]];
    
        const body = (schedule?.rows || []).map(row => {
            const totalScheduledHours = Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
            return [
                row.Name || 'N/A',
                ...DAYS_OF_WEEK.map(day => {
                    const shift = row.shifts?.[day.toLowerCase()] || 'OFF';
                    const hours = parseShift(shift);
                    return hours > 0 ? `${shift}\n(${hours.toFixed(2)})` : shift;
                }),
                { content: decimalHoursToHM(totalScheduledHours), styles: { fontStyle: 'bold', halign: 'center' } }
            ];
        });
    
        const pageContent = data => {
            // Header
            doc.setFontSize(20);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('Rudsak', data.settings.margin.left, 40);
    
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            const headerText = `${t.schedule || 'Schedule'} - ${t.store || 'Store'} ${selectedStore || 'N/A'}`;
            const headerTextWidth = doc.getStringUnitWidth(headerText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
            doc.text(headerText, doc.internal.pageSize.getWidth() - data.settings.margin.right - headerTextWidth, 40);
            
            doc.setFontSize(10);
            const subHeaderText = `${t.week || 'Week'} ${currentWeek || 'N/A'} (${dateRange}, ${currentYear || 'N/A'})`;
            const subHeaderTextWidth = doc.getStringUnitWidth(subHeaderText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
            doc.text(subHeaderText, doc.internal.pageSize.getWidth() - data.settings.margin.right - subHeaderTextWidth, 55);

            // Footer (no page numbering requested earlier)
            doc.setFontSize(10);
            // no page number
        };
    
        doc.autoTable({
            head: head,
            body: body,
            startY: 70,
            theme: 'grid',
            didDrawPage: pageContent,
            styles: {
                cellPadding: 4,
                fontSize: 9,
                valign: 'middle',
                cellWidth: 'wrap'
            },
            headStyles: {
                textColor: [255, 255, 255],
                fillColor: [41, 41, 41],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 120 },
                8: { cellWidth: 60, halign: 'center' },
            }
        });
        
        const finalY = doc.autoTable.previous?.finalY || 70;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const footerText = `${t.totalStoreHours || 'Total Store Hours'}: ${decimalHoursToHM(totalScheduledHoursWeek)}`;
        const footerTextWidth = doc.getStringUnitWidth(footerText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        doc.text(footerText, doc.internal.pageSize.getWidth() - 40 - footerTextWidth, finalY + 40);

        doc.save(`Schedule-Store-${selectedStore}-Week${currentWeek}.pdf`);
    };

    if (isLoading || !schedule) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    /* ---------------------- Render ---------------------- */
    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-end mb-4 gap-4 no-print">
                     <button onClick={handleDownloadPdf} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        <Download size={18} className="mr-2"/> {t.downloadPdf}
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
                <div id="schedule-table" className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 align-top">{t.employeeId}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.employeeName}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.jobTitleDescription}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.salesObjective}</th>
                                {weekDays.map(day => <th key={day} scope="col" className="px-2 py-3 text-center">{day}</th>)}
                                <th scope="col" className="px-4 py-3 align-top">{t.totalSchedHrs}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.totalActualHrs}</th>
                                <th scope="col" className="px-4 py-3 align-top no-print">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.rows.map(row => {
                                const totalScheduledHours = Object.values(row.shifts || {}).reduce((sum, s) => sum + parseShift(s), 0);
                                const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);

                                const isManual = String(row.EmployeeID || '').startsWith('new_') || row.isGuest;

                                return (
                                    <tr key={row.EmployeeID}>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                placeholder="ID"
                                                value={row.PositionID || ''}
                                                readOnly={!isManual}
                                                onChange={(e) => isManual && handleRowChange(row.EmployeeID, 'PositionID', e.target.value)}
                                                className={`w-24 ${isManual ? 'bg-gray-700' : 'bg-gray-700'} border border-gray-600 rounded-md px-2 py-1`}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                placeholder={t.enterName}
                                                value={row.Name || ''}
                                                readOnly={!isManual}
                                                onChange={(e) => isManual && handleRowChange(row.EmployeeID, 'Name', e.target.value)}
                                                className="w-40 bg-gray-700 border border-gray-600 rounded-md px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={row.JobTitle}
                                                readOnly={!isManual}
                                                onChange={(e) => isManual && handleRowChange(row.EmployeeID, 'JobTitle', e.target.value)}
                                                className="w-40 bg-gray-700 border border-gray-600 rounded-md px-2 py-1"
                                            >
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
                                            const calculatedHours = parseShift(shiftValue);
                                            return (
                                            <td key={day} className="px-2 py-2 align-top">
                                                <div className="flex flex-col items-center space-y-1">
                                                    <input 
                                                        type="text" 
                                                        placeholder={t.shift} 
                                                        value={shiftValue} 
                                                        onChange={(e) => handleRowChange(row.EmployeeID, 'shifts', e.target.value, dayKey)} 
                                                        className={`w-24 border border-gray-600 rounded-md px-2 py-1 text-center ${isVacation ? 'bg-blue-900/50' : 'bg-gray-900/70'}`} 
                                                    />
                                                    <div className="w-24 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-center text-xs text-gray-400 h-8 flex items-center justify-center">
                                                        {calculatedHours > 0 ? `(${calculatedHours.toFixed(2)})` : '(0.00)'}
                                                    </div>
                                                    <div className="relative group w-24">
                                                        {isEditing ? (
                                                            <input 
                                                                type="number" 
                                                                value={row.actualHours?.[dayKey] || ''} 
                                                                onBlur={() => setEditingCell(null)}
                                                                onChange={e => handleRowChange(row.EmployeeID, 'actualHours', e.target.value, dayKey)} 
                                                                autoFocus
                                                                className={`w-full bg-gray-900 border border-blue-500 rounded-md px-2 py-1 text-center`} 
                                                                step="0.25" 
                                                            />
                                                        ) : (
                                                            <div 
                                                                onDoubleClick={() => !schedule.isLocked && setEditingCell(`${row.EmployeeID}-${dayKey}`)}
                                                                className={`w-full bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center ${schedule.isLocked ? 'bg-gray-700' : 'cursor-pointer hover:bg-gray-800'}`}
                                                            >
                                                                {decimalHoursToHM(row.actualHours?.[dayKey] || 0)}
                                                                {!schedule.isLocked && <button onClick={() => { setTimeAdjustmentData({row, dayIndex, day: weekDays[dayIndex]}); setIsManagerPasscodeOpen(true); }} className="absolute right-0 top-0 h-full px-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity no-print"><Edit2 size={12}/></button>}
                                                            </div>
                                                        )}
                                                        
                                                    </div>
                                                </div>
                                            </td>
                                        )})}
                                        <td className="px-4 py-2 text-center font-bold">{decimalHoursToHM(totalScheduledHours)}</td>
                                        <td className="px-4 py-2 text-center font-bold print-hide">{decimalHoursToHM(totalActualHours)}</td>
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
