import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Target, X, UserPlus, Download, Lock, Unlock, Edit2 } from 'lucide-react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { PasscodeModal } from '../components/PasscodeModal';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, JOB_TITLES } from '../constants';
import { parseShift } from '../utils/helpers';

// ============================================================================
// Utility: Convert decimal hours to readable "xh ym" format
// ============================================================================
const decimalHoursToHM = (decimalHours) => {
  if (!decimalHours || decimalHours <= 0) return "0h 0m";
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

// ============================================================================
// DAILY OBJECTIVE MODAL
// ============================================================================
const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => {
  const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">
            {t.dailySalesObjectivesFor.replace('{name}', row.Name)}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {weekDays.map((day, i) => (
            <div key={day}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{day}</label>
              <input
                type="number"
                value={row.dailyObjectives?.[DAYS_OF_WEEK[i].toLowerCase()] || ''}
                onChange={e => onRowChange(row.EmployeeID, 'dailyObjectives', e.target.value, DAYS_OF_WEEK[i].toLowerCase())}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ADD GUEST ASSOCIATE MODAL
// ============================================================================
const AddGuestAssociateModal = ({ isOpen, onClose, onAdd, allEmployees, currentScheduleRows, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  if (!isOpen) return null;

  const currentEmployeeIds = new Set(currentScheduleRows.map(r => r.EmployeeID));
  const filteredEmployees = allEmployees.filter(emp =>
    !currentEmployeeIds.has(emp.EmployeeID) &&
    emp.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{t.addGuestEmployee}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
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
              <button
                onClick={() => { onAdd(emp); onClose(); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
              >
                {t.addEmployee}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TIME ADJUSTMENT MODAL (5 inputs: Clock In / Lunch Out / Lunch In / Clock Out / Reason)
// ============================================================================
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
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Clock In</label>
            <input type="text" value={clockIn} onChange={e => setClockIn(e.target.value)} placeholder="e.g. 9:00am"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Lunch Out</label>
            <input type="text" value={lunchOut} onChange={e => setLunchOut(e.target.value)} placeholder="e.g. 12:30pm"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Lunch In</label>
            <input type="text" value={lunchIn} onChange={e => setLunchIn(e.target.value)} placeholder="e.g. 1:00pm"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Clock Out</label>
            <input type="text" value={clockOut} onChange={e => setClockOut(e.target.value)} placeholder="e.g. 5:30pm"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Reason for Adjustment</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" rows="3" />
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
// ============================================================================
// MAIN SCHEDULE COMPONENT
// ============================================================================
export const Schedule = ({
  allEmployees,
  selectedStore,
  currentWeek,
  currentYear,
  currentDate,
  API_BASE_URL,
  setNotification,
  t,
  language
}) => {
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [timeAdjustmentData, setTimeAdjustmentData] = useState(null);
  const [isManagerPasscodeOpen, setIsManagerPasscodeOpen] = useState(false);
  const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

  // --------------------------------------------------------------------------
  // FETCH SCHEDULE AND TIME LOGS (No automatic 30-min deduction)
  // --------------------------------------------------------------------------
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
          const storeEmployees = allEmployees.filter(e => e.StoreID === selectedStore);
          scheduleData = {
            rows: storeEmployees.map(e => ({
              EmployeeID: e.EmployeeID,
              Name: e.Name,
              PositionID: e.PositionID,
              JobTitle: e.JobTitle,
              objective: 0,
              shifts: {},
              actualHours: {},
              dailyObjectives: {}
            })),
            isLocked: false
          };
        } else scheduleData = data;
      } else {
        const storeEmployees = allEmployees.filter(e => e.StoreID === selectedStore);
        scheduleData = {
          rows: storeEmployees.map(e => ({
            EmployeeID: e.EmployeeID,
            Name: e.Name,
            PositionID: e.PositionID,
            JobTitle: e.JobTitle,
            objective: 0,
            shifts: {},
            actualHours: {},
            dailyObjectives: {}
          })),
          isLocked: false
        };
      }

      const timeLogs = timeLogsRes.ok ? await timeLogsRes.json() : [];

      // Compute actual hours per day — no lunch deduction
      scheduleData.rows.forEach(r => {
        const empLogs = timeLogs.filter(l => l.EmployeeID === r.EmployeeID);
        const dailyHours = {};
        empLogs.forEach(log => {
          if (log.ClockIn && log.ClockOut) {
            const start = new Date(log.ClockIn);
            const end = new Date(log.ClockOut);
            const day = DAYS_OF_WEEK[start.getUTCDay()].toLowerCase();
            let duration = (end - start) / (1000 * 60 * 60);
            if (duration > 24 || duration < 0) duration = 0;
            dailyHours[day] = duration;
          }
        });
        r.actualHours = dailyHours;
      });

      setSchedule(scheduleData);
    } catch (e) {
      console.error('Error fetching schedule:', e);
      setSchedule({ rows: [], isLocked: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStore && allEmployees.length > 0) fetchSchedule();
  }, [selectedStore, currentWeek, currentYear, allEmployees]);

  // --------------------------------------------------------------------------
  // CORE HANDLERS
  // --------------------------------------------------------------------------
  const handleRowChange = (id, field, value, day) => {
    const newRows = schedule.rows.map(r => {
      if (r.EmployeeID === id) {
        if (day) return { ...r, [field]: { ...r[field], [day]: value } };
        return { ...r, [field]: value };
      }
      return r;
    });
    setSchedule({ ...schedule, rows: newRows });
  };

  const handleAddRow = () => {
    const newRow = {
      EmployeeID: `new_${Date.now()}`,
      Name: '',
      PositionID: '',
      JobTitle: JOB_TITLES[0],
      objective: 0,
      shifts: {},
      actualHours: {},
      dailyObjectives: {},
      isNew: true
    };
    setSchedule(prev => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleAddGuest = (emp) => {
    const newRow = {
      EmployeeID: emp.EmployeeID,
      Name: emp.Name,
      PositionID: emp.PositionID,
      JobTitle: emp.JobTitle,
      objective: 0,
      shifts: {},
      actualHours: {},
      dailyObjectives: {},
      isGuest: true,
      homeStore: emp.StoreID
    };
    setSchedule(prev => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleRemoveRow = (id) =>
    setSchedule(prev => ({ ...prev, rows: prev.rows.filter(r => r.EmployeeID !== id) }));

  // --------------------------------------------------------------------------
  // SAVE / FINALIZE WEEK
  // --------------------------------------------------------------------------
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
      if (lockWeek) fetchSchedule();
    } catch (e) {
      console.error('Save failed:', e);
      setNotification({ message: t.errorSavingSchedule, type: 'error' });
      setSaveState('idle');
    }
    setIsConfirmModalOpen(false);
  };

  const handleConfirmFinalize = () => executeSaveSchedule(true);

  // --------------------------------------------------------------------------
  // TIME ADJUSTMENT (NEW MULTI-FIELD VERSION)
  // --------------------------------------------------------------------------
  const handleTimeAdjustmentSave = async ({ clockIn, lunchOut, lunchIn, clockOut, reason }) => {
    if (!timeAdjustmentData) return;
    const { row, dayIndex } = timeAdjustmentData;

    const weekStart = new Date(currentDate);
    const currentDay = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - currentDay + dayIndex);

    const parseTime = (s) => {
      if (!s) return null;
      const pm = s.toLowerCase().includes('pm');
      const am = s.toLowerCase().includes('am');
      let [h, m] = s.replace(/am|pm/gi, '').trim().split(':').map(Number);
      m = m || 0;
      if (pm && h < 12) h += 12;
      if (am && h === 12) h = 0;
      return { h, m };
    };

    const parseToDate = (s) => {
      const t = parseTime(s);
      if (!t) return null;
      return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), t.h, t.m);
    };

    const clockInDate = parseToDate(clockIn);
    const lunchOutDate = parseToDate(lunchOut);
    const lunchInDate = parseToDate(lunchIn);
    const clockOutDate = parseToDate(clockOut);

    try {
      await fetch(`${API_BASE_URL}/timelog/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: row.EmployeeID,
          storeId: selectedStore,
          clockIn: clockInDate ? clockInDate.toISOString() : null,
          lunchOut: lunchOutDate ? lunchOutDate.toISOString() : null,
          lunchIn: lunchInDate ? lunchInDate.toISOString() : null,
          clockOut: clockOutDate ? clockOutDate.toISOString() : null,
          week: currentWeek,
          year: currentYear,
          reason
        })
      });

      setNotification({ message: 'Time adjustment saved successfully.', type: 'success' });
      await fetchSchedule(); // refresh hours after adjustment
    } catch (e) {
      console.error('Adjustment failed:', e);
      setNotification({ message: 'Error saving time adjustment.', type: 'error' });
    }
  };

  const handleManagerPasscodeSuccess = () => {
    setIsManagerPasscodeOpen(false);
    setTimeAdjustmentData(prev => ({ ...prev, authorized: true }));
  };

  if (isLoading || !schedule)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  // --------------------------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------------------------
  return (
    <>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-end mb-4 gap-4 no-print">
          <button onClick={() => window.print()}
            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
            <Download size={18} className="mr-2" /> {t.downloadPdf}
          </button>

          {schedule.isLocked ? (
            <span className="flex items-center bg-gray-700 text-green-400 font-bold py-2 px-4 rounded-lg">
              <Lock size={18} className="mr-2" /> {t.weekLocked}
            </span>
          ) : (
            <button onClick={() => setIsConfirmModalOpen(true)}
              className="flex items-center bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg">
              <Unlock size={18} className="mr-2" /> {t.finalizeWeek}
            </button>
          )}

          <SaveButton onClick={() => executeSaveSchedule()} saveState={saveState} text={t.saveSchedule} />
        </div>

        {/* ================= TABLE ================= */}
        <div id="schedule-table" className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
              <tr>
                <th className="px-4 py-3">{t.employeeId}</th>
                <th className="px-4 py-3">{t.employeeName}</th>
                <th className="px-4 py-3">{t.jobTitleDescription}</th>
                <th className="px-4 py-3">{t.salesObjective}</th>
                {weekDays.map(day => (
                  <th key={day} className="px-2 py-3 text-center">{day}</th>
                ))}
                <th className="px-4 py-3">{t.totalSchedHrs}</th>
                <th className="px-4 py-3">{t.totalActualHrs}</th>
                <th className="px-4 py-3 no-print">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.rows.map(row => {
                const totalSched = Object.values(row.shifts || {}).reduce((s, h) => s + parseShift(h), 0);
                const totalActual = Object.values(row.actualHours || {}).reduce((s, h) => s + (Number(h) || 0), 0);

                return (
                  <tr key={row.EmployeeID}>
                    <td className="px-4 py-2">
                      <input type="text" value={row.PositionID || ''} readOnly={!row.isNew}
                        onChange={e => handleRowChange(row.EmployeeID, 'PositionID', e.target.value)}
                        className={`w-24 border rounded-md px-2 py-1 ${row.isNew ? 'bg-gray-900' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={row.Name || ''} readOnly={!row.isNew}
                        onChange={e => handleRowChange(row.EmployeeID, 'Name', e.target.value)}
                        className={`w-40 border rounded-md px-2 py-1 ${row.isNew ? 'bg-gray-900' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`} />
                    </td>
                    <td className="px-4 py-2">
                      <select value={row.JobTitle} disabled={!row.isNew}
                        onChange={e => handleRowChange(row.EmployeeID, 'JobTitle', e.target.value)}
                        className={`w-40 border rounded-md px-2 py-1 ${row.isNew ? 'bg-gray-900' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                        {JOB_TITLES.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <input type="number" value={row.objective || 0} readOnly
                          className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1" />
                        <button onClick={() => setEditingObjectivesFor(row)}
                          className="text-blue-400 hover:text-blue-300"><Target size={18} /></button>
                      </div>
                    </td>

                    {DAYS_OF_WEEK.map((day, dayIdx) => {
                      const key = day.toLowerCase();
                      const val = row.shifts?.[key] || '';
                      const hrs = parseShift(val);
                      return (
                        <td key={day} className="px-2 py-2 text-center">
                          <input type="text" value={val}
                            onChange={e => handleRowChange(row.EmployeeID, 'shifts', e.target.value, key)}
                            className="w-24 border border-gray-600 rounded-md px-2 py-1 text-center bg-gray-900/70" />
                          <div className="text-xs text-gray-400 mt-1">({hrs.toFixed(2)})</div>
                          <div className="relative w-24 border border-gray-600 rounded-md px-2 py-1 text-center bg-gray-900/70 flex items-center justify-center text-xs text-gray-300 mt-1 h-8">
  <span>{decimalHoursToHM(row.actualHours[key] || 0)}</span>
  <button
    onClick={() => {
      setTimeAdjustmentData({ row, dayIndex: dayIdx, day: weekDays[dayIdx] });
      setIsManagerPasscodeOpen(true);
    }}
    className="absolute right-1 text-gray-500 hover:text-white"
    title={t.adjust}
  >
    <Edit2 size={12} />
  </button>
                        </td>
                      );
                    })}

                    <td className="px-4 py-2 text-center font-bold">{decimalHoursToHM(totalSched)}</td>
                    <td className="px-4 py-2 text-center font-bold">{decimalHoursToHM(totalActual)}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleRemoveRow(row.EmployeeID)}
                        className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 flex gap-4 no-print">
            <button onClick={handleAddRow}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
              <PlusCircle size={20} className="mr-2" /> {t.addToSchedule}
            </button>
            <button onClick={() => setIsGuestModalOpen(true)}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
              <UserPlus size={20} className="mr-2" /> {t.addGuestEmployee}
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}
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

            {timeAdjustmentData?.authorized && (
        <TimeAdjustmentModal
          isOpen={!!timeAdjustmentData}
          onClose={() => setTimeAdjustmentData(null)}
          onSave={handleTimeAdjustmentSave}
          employeeName={timeAdjustmentData.row?.Name}
          day={timeAdjustmentData.day}
          t={t}
        />
      )}
    </>
  );
};

