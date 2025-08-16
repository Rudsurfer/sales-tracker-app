import React, { useState, useEffect } from 'react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { PlusCircle, Trash2 } from 'lucide-react';

export const DailyPlanner = ({ selectedStore, currentDate, API_BASE_URL, setNotification, t, allEmployees }) => {
    const [planner, setPlanner] = useState({ notes: '', priorities: [], tasks: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [newPriority, setNewPriority] = useState('');
    const [newTask, setNewTask] = useState({ description: '', assignedTo: '' });

    const dateString = currentDate.toISOString().split('T')[0];

    useEffect(() => {
        const fetchPlanner = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/planners/${selectedStore}/${dateString}`);
                if (response.ok) {
                    const data = await response.json();
                    setPlanner({
                        notes: data.Notes || '',
                        priorities: data.Priorities || [],
                        tasks: data.Tasks || []
                    });
                } else {
                    setPlanner({ notes: '', priorities: [], tasks: [] });
                }
            } catch (error) {
                console.error("Error fetching planner:", error);
                setPlanner({ notes: '', priorities: [], tasks: [] });
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
                    notes: planner.notes,
                    priorities: planner.priorities,
                    tasks: planner.tasks
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

    const handleAddPriority = () => {
        if (newPriority.trim()) {
            setPlanner(p => ({ ...p, priorities: [...p.priorities, newPriority] }));
            setNewPriority('');
        }
    };

    const handleRemovePriority = (index) => {
        setPlanner(p => ({ ...p, priorities: p.priorities.filter((_, i) => i !== index) }));
    };

    const handleAddTask = () => {
        if (newTask.description.trim()) {
            setPlanner(p => ({ ...p, tasks: [...p.tasks, newTask] }));
            setNewTask({ description: '', assignedTo: '' });
        }
    };

    const handleRemoveTask = (index) => {
        setPlanner(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== index) }));
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{t.plannerForDate.replace('{date}', new Date(dateString).toLocaleDateString())}</h2>
                <SaveButton onClick={() => setIsConfirmModalOpen(true)} saveState={saveState} text={t.savePlanner} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-white">{t.dailyNotes}</h3>
                    <textarea value={planner.notes} onChange={e => setPlanner(p => ({...p, notes: e.target.value}))} placeholder={t.generalNotesPlaceholder} className="w-full h-64 bg-gray-900 border border-gray-600 rounded-md p-3"></textarea>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-white">{t.topPriorities}</h3>
                        <div className="space-y-2">
                            {planner.priorities.map((p, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                    <span>{p}</span>
                                    <button onClick={() => handleRemovePriority(i)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex mt-4 gap-2">
                            <input type="text" value={newPriority} onChange={e => setNewPriority(e.target.value)} placeholder="New priority..." className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                            <button onClick={handleAddPriority} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"><PlusCircle size={20}/></button>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-white">{t.taskList}</h3>
                        <div className="space-y-2">
                            {planner.tasks.map((task, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                    <span>{task.description}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">{task.assignedTo || t.unassigned}</span>
                                        <button onClick={() => handleRemoveTask(i)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="flex mt-4 gap-2">
                            <input type="text" value={newTask.description} onChange={e => setNewTask(t => ({...t, description: e.target.value}))} placeholder={t.taskDescriptionPlaceholder} className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                            <select value={newTask.assignedTo} onChange={e => setNewTask(t => ({...t, assignedTo: e.target.value}))} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                                <option value="">{t.unassigned}</option>
                                {allEmployees.filter(e => e.AssociatedStore === selectedStore).map(emp => <option key={emp.EmployeeID} value={emp.Name}>{emp.Name}</option>)}
                            </select>
                            <button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg"><PlusCircle size={20}/></button>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleSave} title={t.confirmSave} t={t}><p>{t.plannerForDate.replace('{date}', new Date(dateString).toLocaleDateString())}</p></ConfirmationModal>
        </div>
    );
};
