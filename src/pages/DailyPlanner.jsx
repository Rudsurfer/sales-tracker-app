import React, { useState, useEffect } from 'react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { PlusCircle, Trash2 } from 'lucide-react';

export const DailyPlanner = ({ selectedStore, currentDate, API_BASE_URL, setNotification, t, allEmployees }) => {
    const [planner, setPlanner] = useState({ notes: '', priorities: [], tasks: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const dateString = currentDate.toISOString().split('T')[0];

    useEffect(() => {
        const fetchPlanner = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/planners/${selectedStore}/${dateString}`);
                if (response.ok) {
                    const data = await response.json();
                    setPlanner(data);
                } else {
                    setPlanner({ notes: '', priorities: [], tasks: [] });
                }
            } catch (error) {
                console.error("Error fetching planner:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlanner();
    }, [selectedStore, dateString, API_BASE_URL]);

    const handleSave = async () => {
        setSaveState('saving');
        try {
            await fetch(`${API_BASE_URL}/planners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: selectedStore,
                    date: dateString,
                    ...planner
                })
            });
            setSaveState('saved');
            setNotification({ message: t.plannerSaved, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving planner:", error);
            setNotification({ message: t.errorSavingPlanner, type: 'error' });
            setSaveState('idle');
        }
        setIsConfirmModalOpen(false);
    };

    // ... (rest of the component logic for handling priorities and tasks)

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-6">
             {/* ... (JSX for planner UI) ... */}
        </div>
    );
};
