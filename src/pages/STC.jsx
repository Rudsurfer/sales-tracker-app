import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, OPERATING_HOURS } from '../constants';

export const STC = ({ stcData, currentWeek, currentYear, db, appId, selectedStore, setNotification, t, language }) => {
    const [activeDay, setActiveDay] = useState(new Date().getDay());
    const [dayData, setDayData] = useState({});
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        setDayData(stcData.days || {});
    }, [stcData]);

    const handleDataChange = (hour, field, value) => {
        const dayKey = DAYS_OF_WEEK[activeDay].toLowerCase();
        const updatedDayData = {
            ...(dayData[dayKey] || {}),
            [hour]: {
                ...(dayData[dayKey]?.[hour] || {}),
                [field]: Number(value)
            }
        };
        setDayData(prev => ({
            ...prev,
            [dayKey]: updatedDayData
        }));
    };

    const executeSaveChanges = async () => {
        if (!db) return;
        setSaveState('saving');
        const stcDocId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/stc`, stcDocId);
        try {
            await setDoc(docRef, {
                week: currentWeek,
                year: currentYear,
                days: dayData,
                storeId: selectedStore
            }, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.stcDataSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving STC data: ", error);
            setNotification({ message: t.errorSavingStc, type: 'error' });
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSaveChanges();
    };
    
    const calculateConversion = (hourData) => {
        if (!hourData || !hourData.traffic || hourData.traffic === 0) return '0.00%';
        const conversion = (hourData.transactions || 0) / hourData.traffic * 100;
        return `${conversion.toFixed(2)}%`;
    };

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
                    <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.saveChanges} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t.hour}</th><th scope="col" className="px-6 py-3">{t.footTraffic}</th><th scope="col" className="px-6 py-3">{t.transactions}</th><th scope="col" className="px-6 py-3">{t.employees}</th><th scope="col" className="px-6 py-3">{t.conversion}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {OPERATING_HOURS.map(hour => {
                                const currentHourData = dayData[DAYS_OF_WEEK[activeDay].toLowerCase()]?.[hour] || {};
                                return (
                                    <tr key={hour}>
                                        <td className="px-6 py-4 font-medium text-white">{hour}</td>
                                        <td className="px-6 py-4"><input type="number" value={currentHourData.traffic || ''} onChange={(e) => handleDataChange(hour, 'traffic', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-6 py-4"><input type="number" value={currentHourData.transactions || ''} onChange={(e) => handleDataChange(hour, 'transactions', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-6 py-4"><input type="number" value={currentHourData.employees || ''} onChange={(e) => handleDataChange(hour, 'employees', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
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
                onConfirm={handleConfirmSave}
                title={t.confirmSaveStc}
                t={t}
            >
                <p>{t.confirmSaveStcMsg.replace('{day}', weekDays[activeDay])}</p>
            </ConfirmationModal>
        </>
    );
};
