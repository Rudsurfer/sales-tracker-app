import React, { useState, useEffect, useMemo } from 'react';
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
  const [clockIn, setClockIn] = useState('');
  const [lunchOut, setLunchOut] = useState('');
  const [lunchIn, setLunchIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!clockIn || !clockOut || !reason) {
            alert(t.fillAllFields);
            return;
        }
       onSave({ clockIn, lunchOut, lunchIn, clockOut, reason });
        onClose();
    };

    return (
       <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">
            Time Adjustment for {employeeName} on {day}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Clock In</label>
            <input
              type="text"
              value={clockIn}
              onChange={e => setClockIn(e.target.value)}
              placeholder="e.g. 9:00 am"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Lunch Out</label>
            <input
              type="text"
              value={lunchOut}
              onChange={e => setLunchOut(e.target.value)}
              placeholder="e.g. 12:30 pm"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Lunch In</label>
            <input
              type="text"
              value={lunchIn}
              onChange={e => setLunchIn(e.target.value)}
              placeholder="e.g. 1:00 pm"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Clock Out</label>
            <input
              type="text"
              value={clockOut}
              onChange={e => setClockOut(e.target.value)}
              placeholder="e.g. 5:30 pm"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Reason for Adjustment</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
              rows="3"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
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

            scheduleData.rows.forEach(row => {
                const employeeLogs = timeLogs.filter(log => log.EmployeeID === row.EmployeeID);
                const dailyHours = {};
                employeeLogs.forEach(log => {
                    if (log.ClockIn && log.ClockOut) {
  const clockInDate = new Date(log.ClockIn);
  const clockOutDate = new Date(log.ClockOut);
  const day = DAYS_OF_WEEK[clockInDate.getUTCDay()].toLowerCase();

  // Calculate total duration (no automatic lunch deduction)
  const duration = (clockOutDate - clockInDate) / (1000 * 60 * 60);

  dailyHours[day] = (dailyHours[day] || 0) + duration;
}

                });
                row.actualHours = dailyHours;
            });

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
        // <-- change: mark manual-created rows as editable via isNew flag
        const newRow = { EmployeeID: `new_${Date.now()}`, Name: '', PositionID: '', JobTitle: JOB_TITLES[0], objective: 0, shifts: {}, actualHours: {}, dailyObjectives: {}, isNew: true };
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
    
    const handleFinalizeWeek = () => setIsConfirmModalOpen(true);
    const handleConfirmFinalize = () => {
        executeSaveSchedule(true);
    };

    const handleTimeAdjustmentSave = async ({ clockIn, clockOut, reason }) => {
        if (!timeAdjustmentData) return;
        const { row, dayIndex } = timeAdjustmentData;
        
        const weekStartDate = new Date(currentDate);
        const currentDayOfWeek = weekStartDate.getUTCDay();
        weekStartDate.setUTCDate(weekStartDate.getUTCDate() - currentDayOfWeek + dayIndex);

        const parseTime = (timeStr) => {
            const isPm = timeStr.toLowerCase().includes('pm');
            const isAm = timeStr.toLowerCase().includes('am');
            let [hours, minutes] = timeStr.replace(/am|pm/gi, '').trim().split(':').map(Number);
            minutes = minutes || 0;
            if (isPm && hours < 12) hours += 12;
            if (isAm && hours === 12) hours = 0; // Midnight case
            return { hours, minutes };
        };

        const { hours: inHours, minutes: inMinutes } = parseTime(clockIn);
        const { hours: outHours, minutes: outMinutes } = parseTime(clockOut);

        const clockInDate = new Date(Date.UTC(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate(), inHours, inMinutes));
        const clockOutDate = new Date(Date.UTC(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate(), outHours, outMinutes));

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
                    reason,
                })
            });
            setNotification({ message: "Time adjustment saved.", type: 'success' });
            fetchSchedule(); 
        } catch (error) {
            console.error("Error saving time adjustment:", error);
            setNotification({ message: "Error saving adjustment.", type: 'error' });
        }
    };
    
    const handleManagerPasscodeSuccess = () => {
        setIsManagerPasscodeOpen(false);
        setTimeAdjustmentData(prev => ({...prev, authorized: true }));
    };

    const handleDownloadPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    
        const startOfWeek = new Date(currentDate);
        startOfWeek.setUTCDate(currentDate.getUTCDate() - currentDate.getUTCDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
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

            // Footer
            doc.setFontSize(10);
            const pageNumText = `Page ${data.pageNumber}`;
            doc.text(pageNumText, data.settings.margin.left, doc.internal.pageSize.getHeight() - 20);
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
        
        const finalY = doc.autoTable.previous.finalY;
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
                                return (
                                    <tr key={row.EmployeeID}>
                                        <td className="px-4 py-2">
                                            <input 
                                                type="text" 
                                                placeholder="ID" 
                                                value={row.PositionID || ''} 
                                                onChange={(e) => handleRowChange(row.EmployeeID, 'PositionID', e.target.value)} 
                                                readOnly={!row.isNew}
                                                className={`w-24 border rounded-md px-2 py-1 ${row.isNew ? 'bg-gray-900 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input 
                                                type="text" 
                                                placeholder={t.enterName} 
                                                value={row.Name || ''} 
                                                onChange={(e) => handleRowChange(row.EmployeeID, 'Name', e.target.value)} 
                                                readOnly={!row.isNew}
                                                className={`w-40 border rounded-md px-2 py-1 ${row.isNew ? 'bg-gray-900 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select 
                                                value={row.JobTitle} 
                                                onChange={(e) => handleRowChange(row.EmployeeID, 'JobTitle', e.target.value)}
                                                disabled={!row.isNew}
                                                className={`w-40 border rounded-md px-2 py-1 ${row.isNew ? 'bg-gray-900 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
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
            {timeAdjustmentData?.authorized && timeAdjustmentData?.row && (
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






