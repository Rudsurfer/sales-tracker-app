import React, { useState, useEffect, useRef } from 'react';
import { Users, LogOut, PlusCircle, Trash2, Upload, Download } from 'lucide-react';
import { ALL_STORES, JOB_TITLES } from '../constants';
import { SaveButton, ConfirmationModal } from '../components/ui';
import Papa from 'papaparse';

// Define the base URL for your new backend API
const API_BASE_URL = 'http://localhost:5000/api';

export const AdminPage = ({ onExit, t, setNotification }) => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newEmployee, setNewEmployee] = useState({ name: '', positionId: '', jobTitle: JOB_TITLES[0], rate: 0, baseSalary: 0, associatedStore: ALL_STORES[0] });
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [importData, setImportData] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch employees from the new backend API
    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employees`);
            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching employees:", error);
            setNotification({ message: 'Failed to load employee data.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleNewEmployeeChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({ ...prev, [name]: value }));
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (!newEmployee.name || !newEmployee.positionId) {
            setNotification({ message: t.fillAllFields, type: 'error' });
            return;
        }
        try {
            await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newEmployee, Rate: Number(newEmployee.rate), BaseSalary: Number(newEmployee.baseSalary), StoreID: newEmployee.associatedStore, Name: newEmployee.name, PositionID: newEmployee.positionId, JobTitle: newEmployee.jobTitle })
            });
            setNewEmployee({ name: '', positionId: '', jobTitle: JOB_TITLES[0], rate: 0, baseSalary: 0, associatedStore: ALL_STORES[0] });
            setNotification({ message: t.employeeAddedSuccess, type: 'success' });
            fetchEmployees(); // Refresh the list
        } catch (error) {
            console.error("Error adding employee:", error);
            setNotification({ message: t.errorAddingEmployee, type: 'error' });
        }
    };

    const handleEmployeeChange = (id, field, value) => {
        setEmployees(current => current.map(emp => (emp.EmployeeID === id ? { ...emp, [field]: value } : emp)));
    };

    const executeSaveChanges = async () => {
        setSaveStatus('saving');
        try {
            const promises = employees.map(emp =>
                fetch(`${API_BASE_URL}/employees/${emp.EmployeeID}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ PositionID: emp.PositionID, Name: emp.Name, JobTitle: emp.JobTitle, Rate: emp.Rate, BaseSalary: emp.BaseSalary, StoreID: emp.AssociatedStore })
                })
            );
            await Promise.all(promises);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Error saving changes:", error);
            setNotification({ message: t.errorSavingChanges, type: 'error' });
            setSaveStatus('idle');
        }
    };

    const handleSaveClick = () => setIsConfirmModalOpen(true);
    const handleConfirmSave = () => { setIsConfirmModalOpen(false); executeSaveChanges(); };
    
    const handleDeleteEmployee = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'DELETE' });
            setNotification({ message: t.employeeDeleted, type: 'success' });
            fetchEmployees(); // Refresh the list
        } catch (error) {
            console.error("Error deleting employee:", error);
            setNotification({ message: t.errorDeletingEmployee, type: 'error' });
        }
    };

    // ... (CSV handling functions remain the same for now)

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8 font-sans">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3" /> {t.employeeDatabase}</h1>
                <button onClick={onExit} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"><LogOut size={18} className="mr-2" /> {t.exit}</button>
            </header>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                {/* ... (UI for buttons remains the same) ... */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">{t.payrollName}</th>
                                <th className="px-4 py-3">{t.positionId}</th>
                                <th className="px-4 py-3">{t.jobTitleDescription}</th>
                                <th className="px-4 py-3">{t.rate}</th>
                                <th className="px-4 py-3">{t.baseSalary}</th>
                                <th className="px-4 py-3">{t.associatedStore}</th>
                                <th className="px-4 py-3">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.EmployeeID} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-2"><input type="text" value={emp.Name} onChange={e => handleEmployeeChange(emp.EmployeeID, 'Name', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><input type="text" value={emp.PositionID} onChange={e => handleEmployeeChange(emp.EmployeeID, 'PositionID', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><select value={emp.JobTitle} onChange={e => handleEmployeeChange(emp.EmployeeID, 'JobTitle', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1">{JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}</select></td>
                                    <td className="px-4 py-2"><input type="number" value={emp.Rate} onChange={e => handleEmployeeChange(emp.EmployeeID, 'Rate', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><input type="number" value={emp.BaseSalary} onChange={e => handleEmployeeChange(emp.EmployeeID, 'BaseSalary', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><select value={emp.AssociatedStore} onChange={e => handleEmployeeChange(emp.EmployeeID, 'AssociatedStore', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1">{ALL_STORES.map(store => <option key={store} value={store}>{store}</option>)}</select></td>
                                    <td className="px-4 py-2"><button onClick={() => handleDeleteEmployee(emp.EmployeeID)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* ... (UI for Add New Employee form remains the same) ... */}
            </div>
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmSave} title={t.confirmSave} t={t}><p>{t.confirmSaveEmployeeDb}</p></ConfirmationModal>
            {/* ... (Confirmation Modal for CSV import remains the same) ... */}
        </div>
    );
};
