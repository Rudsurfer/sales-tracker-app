import React, { useState, useEffect, useMemo } from 'react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, OPERATING_HOURS } from '../constants';

export const STC = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, language }) => {
    const [stcData, setStcData] = useState({ days: {} });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[new Date().getDay()]);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        const fetchStcData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/stc/${selectedStore}/${currentWeek}/${currentYear}`);
                if (response.ok) {
                    const data = await response.json();
                    setStcData({ days: data.HourlyData || {} });
                } else {
                    setStcData({ days: {} });
                }
            } catch (error) {
                console.error("Error fetching STC data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStcData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const handleChange = (hour, field, value) => {
        const dayKey = selectedDay.toLowerCase();
        setStcData(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [dayKey]: {
                    ...prev.days?.[dayKey],
                    [hour]: {
                        ...prev.days?.[dayKey]?.[hour],
                        [field]: Number(value)
                    }
                }
            }
        }));
    };

    const handleSave = async () => {
        setSaveState('saving');
        try {
            await fetch(`${API_BASE_URL}/stc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: selectedStore,
                    week: currentWeek,
                    year: currentYear,
                    hourlyData: stcData.days
                })
            });
            setSaveState('saved');
            setNotification({ message: t.stcDataSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving STC data:", error);
            setNotification({ message: t.errorSavingStc, type: 'error' });
            setSaveState('idle');
        }
        setIsConfirmModalOpen(false);
    };
    
    const dayKey = selectedDay.toLowerCase();
    const totals = useMemo(() => {
        const dayData = stcData.days?.[dayKey] || {};
        return {
            traffic: Object.values(dayData).reduce((sum, h) => sum + (h.traffic || 0), 0),
            transactions: Object.values(dayData).reduce((sum, h) => sum + (h.transactions || 0), 0),
            employees: Object.values(dayData).reduce((sum, h) => sum + (h.employees || 0), 0),
        };
    }, [stcData, dayKey]);
    
    const conversion = totals.traffic > 0 ? (totals.transactions / totals.traffic) * 100 : 0;

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                    {weekDays.map((day, index) => (
                        <button key={day} onClick={() => setSelectedDay(DAYS_OF_WEEK[index])} className={`px-4 py-2 rounded-md text-sm font-bold ${selectedDay === DAYS_OF_WEEK[index] ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                            {day}
                        </button>
                    ))}
                </div>
                 <SaveButton onClick={() => setIsConfirmModalOpen(true)} saveState={saveState} text="Save STC" />
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">{t.hour}</th>
                                <th className="px-4 py-3">{t.footTraffic}</th>
                                <th className="px-4 py-3">{t.transactions}</th>
                                <th className="px-4 py-3">{t.employees}</th>
                                <th className="px-4 py-3">{t.conversion}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {OPERATING_HOURS.map(hour => {
                                const hourData = stcData.days?.[dayKey]?.[hour] || {};
                                const conversion = (hourData.traffic || 0) > 0 ? ((hourData.transactions || 0) / (hourData.traffic || 0)) * 100 : 0;
                                return (
                                    <tr key={hour} className="border-b border-gray-700">
                                        <td className="px-4 py-2 font-medium">{hour}</td>
                                        <td><input type="number" value={hourData.traffic || ''} onChange={e => handleChange(hour, 'traffic', e.target.value)} className="w-24 bg-gray-900 text-center rounded-md p-1" /></td>
                                        <td><input type="number" value={hourData.transactions || ''} onChange={e => handleChange(hour, 'transactions', e.target.value)} className="w-24 bg-gray-900 text-center rounded-md p-1" /></td>
                                        <td><input type="number" value={hourData.employees || ''} onChange={e => handleChange(hour, 'employees', e.target.value)} className="w-24 bg-gray-900 text-center rounded-md p-1" /></td>
                                        <td className="font-bold">{conversion.toFixed(2)}%</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="text-white font-bold">
                            <tr>
                                <td className="px-4 py-3">{t.totals}</td>
                                <td className="px-4 py-3">{totals.traffic}</td>
                                <td className="px-4 py-3">{totals.transactions}</td>
                                <td className="px-4 py-3">{totals.employees}</td>
                                <td className="px-4 py-3">{conversion.toFixed(2)}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleSave} title={t.confirmSaveStc} t={t}><p>{t.confirmSaveStcMsg.replace('{day}', selectedDay)}</p></ConfirmationModal>
        </div>
    );
};
