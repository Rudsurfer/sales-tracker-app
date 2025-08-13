import React, { useState, useEffect } from 'react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR } from '../constants';

export const PerformanceGoals = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, language }) => {
    const [goals, setGoals] = useState({
        weeklySalesTarget: 0,
        daily: {},
        kpi: { dph: 0, dpt: 0, upt: 0 }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        const fetchGoals = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/goals/${selectedStore}/${currentWeek}/${currentYear}`);
                if (response.ok) {
                    const data = await response.json();
                    setGoals({
                        weeklySalesTarget: data.WeeklySalesTarget || 0,
                        daily: data.DailyGoals || {},
                        kpi: data.KpiTargets || { dph: 0, dpt: 0, upt: 0 }
                    });
                }
            } catch (error) {
                console.error("Error fetching goals:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGoals();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const handleChange = (type, key, value) => {
        setGoals(prev => ({
            ...prev,
            [type]: { ...prev[type], [key]: value }
        }));
    };

    const handleSave = async () => {
        setSaveState('saving');
        try {
            await fetch(`${API_BASE_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: selectedStore,
                    week: currentWeek,
                    year: currentYear,
                    weeklySalesTarget: goals.weeklySalesTarget,
                    dailyGoals: goals.daily,
                    kpiTargets: goals.kpi
                })
            });
            setSaveState('saved');
            setNotification({ message: t.goalsSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving goals:", error);
            setNotification({ message: t.errorSavingGoals, type: 'error' });
            setSaveState('idle');
        }
        setIsConfirmModalOpen(false);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyStoreGoals}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t.weeklySalesTarget}</label>
                        <input type="number" value={goals.weeklySalesTarget} onChange={e => setGoals(g => ({...g, weeklySalesTarget: e.target.value}))} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">{t.dailyStoreGoals}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {weekDays.map((day, index) => (
                        <div key={day}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{day}</label>
                            <input type="number" value={goals.daily[DAYS_OF_WEEK[index].toLowerCase()] || ''} onChange={e => handleChange('daily', DAYS_OF_WEEK[index].toLowerCase(), e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">{t.kpiTargets}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t.dollarsPerHour}</label>
                        <input type="number" value={goals.kpi.dph} onChange={e => handleChange('kpi', 'dph', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t.dollarsPerTransaction}</label>
                        <input type="number" value={goals.kpi.dpt} onChange={e => handleChange('kpi', 'dpt', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t.unitsPerTransaction}</label>
                        <input type="number" value={goals.kpi.upt} onChange={e => handleChange('kpi', 'upt', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <SaveButton onClick={() => setIsConfirmModalOpen(true)} saveState={saveState} text={t.saveGoals} />
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleSave}
                title={t.confirmSaveGoals}
                t={t}
            >
                <p>{t.confirmSaveGoalsMsg}</p>
            </ConfirmationModal>
        </div>
    );
};
