import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { PlusCircle, Trash2 } from 'lucide-react';
import { SaveButton } from '../components/ui';

export const DailyPlanner = ({ dailyPlanner, schedule, db, appId, selectedStore, currentDate, setNotification, t }) => {
    const [plannerData, setPlannerData] = useState({ notes: '', priorities: [], tasks: [] });
    const [saveState, setSaveState] = useState('idle');

    useEffect(() => {
        if (dailyPlanner) {
            setPlannerData({
                notes: dailyPlanner.notes || '',
                priorities: dailyPlanner.priorities || [],
                tasks: dailyPlanner.tasks || [],
            });
        }
    }, [dailyPlanner]);

    const handlePlannerChange = (field, value) => {
        setPlannerData(prev => ({ ...prev, [field]: value }));
    };

    const handlePriorityChange = (id, field, value) => {
        const newPriorities = plannerData.priorities.map(p => p.id === id ? { ...p, [field]: value } : p);
        handlePlannerChange('priorities', newPriorities);
    };

    const handleTaskChange = (id, field, value) => {
        const newTasks = plannerData.tasks.map(t => t.id === id ? { ...t, [field]: value } : t);
        handlePlannerChange('tasks', newTasks);
    };

    const addPriority = () => {
        const newPriority = { id: crypto.randomUUID(), text: '', completed: false };
        handlePlannerChange('priorities', [...plannerData.priorities, newPriority]);
    };

    const addTask = () => {
        const newTask = { id: crypto.randomUUID(), text: '', assignedTo: '', completed: false };
        handlePlannerChange('tasks', [...plannerData.tasks, newTask]);
    };

    const deletePriority = (id) => {
        handlePlannerChange('priorities', plannerData.priorities.filter(p => p.id !== id));
    };

    const deleteTask = (id) => {
        handlePlannerChange('tasks', plannerData.tasks.filter(t => t.id !== id));
    };

    const handleSave = async () => {
        if (!db) return;
        setSaveState('saving');
        const plannerDocId = `${selectedStore}-${currentDate.toISOString().split('T')[0]}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/planners`, plannerDocId);
        try {
            await setDoc(docRef, plannerData, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.plannerSaved, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving planner:", error);
            setNotification({ message: t.errorSavingPlanner, type: 'error' });
            setSaveState('idle');
        }
    };

    const employeesOnShift = schedule?.rows?.filter(r => r.name) || [];

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{t.plannerForDate.replace('{date}', currentDate.toLocaleDateString())}</h2>
                <SaveButton onClick={handleSave} saveState={saveState} text={t.savePlanner} />
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-200">{t.dailyNotes}</h3>
                <textarea
                    value={plannerData.notes}
                    onChange={(e) => handlePlannerChange('notes', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                    rows="4"
                    placeholder={t.generalNotesPlaceholder}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">{t.topPriorities}</h3>
                    <div className="space-y-2">
                        {plannerData.priorities.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={p.completed} onChange={(e) => handlePriorityChange(p.id, 'completed', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>
                                <input type="text" value={p.text} onChange={(e) => handlePriorityChange(p.id, 'text', e.target.value)} className={`flex-grow bg-transparent outline-none p-1 rounded ${p.completed ? 'line-through text-gray-500' : 'text-white'}`} />
                                <button onClick={() => deletePriority(p.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addPriority} className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300"><PlusCircle size={16} className="mr-1" /> {t.addPriority}</button>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">{t.taskList}</h3>
                    <div className="space-y-2">
                        {plannerData.tasks.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={t.completed} onChange={(e) => handleTaskChange(t.id, 'completed', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>
                                <input type="text" value={t.text} onChange={(e) => handleTaskChange(t.id, 'text', e.target.value)} className={`w-1/2 bg-transparent outline-none p-1 rounded ${t.completed ? 'line-through text-gray-500' : 'text-white'}`} placeholder={t.taskDescriptionPlaceholder}/>
                                <select value={t.assignedTo} onChange={(e) => handleTaskChange(t.id, 'assignedTo', e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-sm">
                                    <option value="">{t.unassigned}</option>
                                    {employeesOnShift.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                                </select>
                                <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addTask} className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300"><PlusCircle size={16} className="mr-1" /> {t.addTask}</button>
                </div>
            </div>
        </div>
    );
};
