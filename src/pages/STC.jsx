import React, { useState, useEffect } from 'react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, OPERATING_HOURS } from '../constants';

export const STC = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, language }) => {
    const [stcData, setStcData] = useState({ HourlyData: {} });
    const [activeDay, setActiveDay] = useState(new Date().getDay());
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        const fetchStcData = async () => {
            if (!selectedStore) return;
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/stc/${selectedStore}/${currentWeek}/${currentYear}`);
                if (response.ok) {
                    const data = await response.json();
                    setStcData(data);
                } else {
                    setStcData({ HourlyData: {} });
                }
            } catch (error) {
                console.error("Error fetching STC data:", error);
                setStcData({ HourlyData: {} });
            } finally {
                setIsLoading(false);
            }
        };
        fetchStcData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const handleDataChange = (hour, field, value) => {
        const dayKey = DAYS_OF_WEEK[activeDay].toLowerCase();
        const updatedDayData = {
            ...(stcData.HourlyData[dayKey] || {}),
            [hour]: {
                ...(stcData.HourlyData[dayKey]?.[hour] || {}),
                [field]: Number(value)
            }
        };
        setStcData(prev => ({
            ...prev,
            HourlyData: {
                ...prev.HourlyData,
                [dayKey]: updatedDayData
            }
        }));
    };

    const executeSaveChanges = async () => {
        setSaveState('saving');
        try {
            await fetch(`${API_BASE_URL}/stc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: selectedStore,
                    week: currentWeek,
                    year: currentYear,
                    hourlyData: stcData.HourlyData,
                })
            });
            setSaveState('saved');
            setNotification({ message: t.stcDataSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving STC data: ", error);
            setNotification({ message: t.errorSavingStc, type: 'error' });
            setSaveState('idle');
        }
        setIsConfirmModalOpen(false);
    };
    
    const calculateConversion = (hourData) => {
        if (!hourData || !hourData.traffic || hourData.traffic === 0) return '0.00%';
        const conversion = (hourData.transactions || 0) / hourData.traffic * 100;
        return `${conversion.toFixed(2)}%`;
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex border-b border-gray-700">
                        {weekDays.map((day, index) => (
                            <button key={day} onClick={() => setActiveDay(index)}
                                    className={`py-2 px-4 text-sm font-medium transition-colors duration-200 ${activeDay === index ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}`}>
                                {day}
                            </button>
                        ))}
                    </div>
                    <SaveButton onClick={() => setIsConfirmModalOpen(true)} saveState={saveState} text={t.saveChanges} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t.hour}</th>
                                <th scope="col" className="px-6 py-3">{t.footTraffic}</th>
                                <th scope="col" className="px-6 py-3">{t.transactions}</th>
                                <th scope="col" className="px-6 py-3">{t.employees}</th>
                                <th scope="col" className="px-6 py-3">{t.conversion}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {OPERATING_HOURS.map(hour => {
                                const dayKey = DAYS_OF_WEEK[activeDay].toLowerCase();
                                const currentHourData = stcData.HourlyData?.[dayKey]?.[hour] || {};
                                return (
                                    <tr key={hour}>
                                        <td className="px-6 py-4 font-medium text-white">{hour}</td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                value={currentHourData.traffic || ''} 
                                                readOnly 
                                                className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-center" 
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                value={currentHourData.transactions || ''} 
                                                readOnly 
                                                className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-center" 
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                value={currentHourData.employees || ''} 
                                                onChange={(e) => handleDataChange(hour, 'employees', e.target.value)} 
                                                className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center" 
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{calculateConversion(currentHourData)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeSaveChanges}
                title={t.confirmSaveStc}
                t={t}
            >
                <p>{t.confirmSaveStcMsg.replace('{day}', weekDays[activeDay])}</p>
            </ConfirmationModal>
        </>
    );
