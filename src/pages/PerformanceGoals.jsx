import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR } from '../constants';
import { SaveButton, ConfirmationModal } from '../components/ui';

export const PerformanceGoals = ({ performanceGoals, currentWeek, currentYear, db, appId, selectedStore, t, setNotification, language }) => {
    const [goals, setGoals] = useState({ daily: {}, kpi: {} });
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        setGoals(performanceGoals || { daily: {}, kpi: {} });
    }, [performanceGoals]);

    const handleKpiChange = (e) => {
        const { name, value } = e.target;
        setGoals(prev => ({ ...prev, kpi: { ...prev.kpi, [name]: Number(value) } }));
    };

    const handleDailyChange = (day, value) => {
        setGoals(prev => {
            const newDailyGoals = {
                ...prev.daily,
                [day]: Number(value) || 0
            };
            const newWeeklyTarget = Object.values(newDailyGoals).reduce((sum, val) => sum + val, 0);
            return {
                ...prev,
                daily: newDailyGoals,
                weeklySalesTarget: newWeeklyTarget
            };
        });
    };

    const executeSave = async () => {
        if (!db) return;
        setSaveState('saving');
        const docId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/performance_goals`, docId);
        try {
            await setDoc(docRef, { ...goals, storeId: selectedStore, week: currentWeek, year: currentYear }, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.goalsSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving goals:", error);
            setNotification({ message: t.errorSavingGoals, type: 'error' });
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSave();
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-8">
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyStoreGoals}</h2>
                    <div className="flex items-center space-x-4">
                        <label htmlFor="weeklySalesTarget" className="text-gray-300">{t.weeklySalesTarget}:</label>
                        <input type="number" id="weeklySalesTarget" value={goals.weeklySalesTarget || ''} readOnly className="w-48 bg-gray-700 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">{t.dailyStoreGoals}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {weekDays.map((day, index) => (
                            <div key={day}>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{day}</label>
                                <input type="number" value={goals.daily?.[DAYS_OF_WEEK[index].toLowerCase()] || ''} onChange={e => handleDailyChange(DAYS_OF_WEEK[index].toLowerCase(), e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">{t.kpiTargets}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label htmlFor="dph" className="text-gray-300 mb-1">{t.dollarsPerHour}</label>
                            <input type="number" name="dph" id="dph" value={goals.kpi?.dph || ''} onChange={handleKpiChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="dpt" className="text-gray-300 mb-1">{t.dollarsPerTransaction}</label>
                            <input type="number" name="dpt" id="dpt" value={goals.kpi?.dpt || ''} onChange={handleKpiChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="upt" className="text-gray-300 mb-1">{t.unitsPerTransaction}</label>
                            <input type="number" name="upt" id="upt" value={goals.kpi?.upt || ''} onChange={handleKpiChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" step="0.01" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.saveGoals} />
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSaveGoals}
                t={t}
            >
                <p>{t.confirmSaveGoalsMsg}</p>
            </ConfirmationModal>
        </>
    );
};
