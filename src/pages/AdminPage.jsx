import React, { useState, useEffect, useRef } from 'react';
import { Users, LogOut, PlusCircle, Trash2, Upload, Download } from 'lucide-react';
import { ALL_STORES, JOB_TITLES } from '../constants';
import { SaveButton, ConfirmationModal } from '../components/ui';
import Papa from 'papaparse';

export const AdminPage = ({ onExit, t, setNotification, API_BASE_URL, allEmployees, refreshEmployees }) => {
    const [employees, setEmployees] = useState(allEmployees);
    const [newEmployee, setNewEmployee] = useState({ name: '', positionId: '', jobTitle: JOB_TITLES[0], rate: 0, baseSalary: 0, associatedStore: ALL_STORES[0] });
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [importData, setImportData] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setEmployees(allEmployees);
    }, [allEmployees]);

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
            // **FIX: This object now correctly maps the frontend state to the backend's expected column names.**
            const newEmployeeData = {
                Name: newEmployee.name,
                PositionID: newEmployee.positionId,
                JobTitle: newEmployee.jobTitle,
                Rate: Number(newEmployee.rate),
                BaseSalary: Number(newEmployee.baseSalary),
                StoreID: newEmployee.associatedStore
            };
            await fetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployeeData)
            });
            setNewEmployee({ name: '', positionId: '', jobTitle: JOB_TITLES[0], rate: 0, baseSalary: 0, associatedStore: ALL_STORES[0] });
            setNotification({ message: t.employeeAddedSuccess, type: 'success' });
            // **FIX: This now calls the function from App.jsx to refresh the master employee list.**
            refreshEmployees();
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
                    // **FIX: This now correctly sends the `AssociatedStore` field.**
                    body: JSON.stringify({ PositionID: emp.PositionID, Name: emp.Name, JobTitle: emp.JobTitle, Rate: emp.Rate, BaseSalary: emp.BaseSalary, StoreID: emp.AssociatedStore })
                })
            );
            await Promise.all(promises);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
            refreshEmployees();
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
            refreshEmployees();
        } catch (error) {
            console.error("Error deleting employee:", error);
            setNotification({ message: t.errorDeletingEmployee, type: 'error' });
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => setImportData(results.data),
                error: () => setNotification({ message: t.importError, type: 'error' })
            });
        }
    };
    
    const handleConfirmImport = async () => {
        // This function will need to be updated to call the backend API
        console.log("Importing data:", importData);
        setImportData(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownloadTemplate = () => {
        const csv = "name,positionId,jobTitle,rate,baseSalary,associatedStore";
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "employee_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8 font-sans">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3" /> {t.employeeDatabase}</h1>
                <button onClick={onExit} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"><LogOut size={18} className="mr-2" /> {t.exit}</button>
            </header>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                 <div className="flex justify-end mb-4 gap-4">
                    <button onClick={handleDownloadTemplate} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"><Download size={18} className="mr-2" /> {t.downloadTemplate}</button>
                    <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer"><Upload size={18} className="mr-2" /> {t.importFromCsv}</label>
                    <SaveButton onClick={handleSaveClick} saveState={saveStatus} text={t.saveChanges} />
                </div>
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
                <div className="mt-8 border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold mb-4">{t.addNewEmployee}</h3>
                    <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <input type="text" name="name" placeholder={t.payrollName} value={newEmployee.name} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                        <input type="text" name="positionId" placeholder={t.positionId} value={newEmployee.positionId} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                        <select name="jobTitle" value={newEmployee.jobTitle} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">{JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}</select>
                        <select name="associatedStore" value={newEmployee.associatedStore} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">{ALL_STORES.map(store => <option key={store} value={store}>{store}</option>)}</select>
                        <input type="number" name="rate" placeholder={t.rate} value={newEmployee.rate} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        <input type="number" name="baseSalary" placeholder={t.baseSalary} value={newEmployee.baseSalary} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        <button type="submit" className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg col-span-full md:col-span-1 lg:col-span-2"><PlusCircle size={18} className="mr-2" /> {t.addEmployee}</button>
                    </form>
                </div>
            </div>
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmSave} title={t.confirmSave} t={t}><p>{t.confirmSaveEmployeeDb}</p></ConfirmationModal>
            <ConfirmationModal isOpen={!!importData} onClose={() => { setImportData(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} onConfirm={handleConfirmImport} title={t.importPreview} t={t}>
                <div className="text-left max-h-60 overflow-y-auto">
                    <p className="mb-2">Review the data below. Click confirm to update/add these employees.</p>
                    <table className="w-full text-xs">
                        <thead><tr className="bg-gray-700"><th className="p-1">Name</th><th className="p-1">Position ID</th><th className="p-1">Store</th></tr></thead>
                        <tbody>{importData?.map((row, i) => (<tr key={i} className="border-b border-gray-700"><td className="p-1">{row.name}</td><td className="p-1">{row.positionId}</td><td className="p-1">{row.associatedStore}</td></tr>))}</tbody>
                    </table>
                </div>
            </ConfirmationModal>
        </div>
    );
};
