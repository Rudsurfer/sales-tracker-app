import React, { useState, useRef } from 'react';
import { collection, addDoc, doc, writeBatch, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { Users, LogOut, PlusCircle, Trash2, Upload, Download } from 'lucide-react';
import { ALL_STORES, JOB_TITLES } from '../constants';
import { SaveButton, ConfirmationModal } from '../components/ui';
import Papa from 'papaparse';

export const AdminPage = ({ onExit, t, db, appId, setNotification, allEmployees }) => {
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
        if (!db || !newEmployee.name || !newEmployee.positionId) {
            setNotification({ message: t.fillAllFields, type: 'error' });
            return;
        }
        try {
            const employeesCollectionRef = collection(db, `artifacts/${appId}/public/data/employees`);
            await addDoc(employeesCollectionRef, { ...newEmployee, rate: Number(newEmployee.rate), baseSalary: Number(newEmployee.baseSalary) });
            setNewEmployee({ name: '', positionId: '', jobTitle: JOB_TITLES[0], rate: 0, baseSalary: 0, associatedStore: ALL_STORES[0] });
            setNotification({ message: t.employeeAddedSuccess, type: 'success' });
        } catch (error) {
            console.error("Error adding employee:", error);
            setNotification({ message: t.errorAddingEmployee, type: 'error' });
        }
    };

    const handleEmployeeChange = (id, field, value) => {
        setEmployees(current => current.map(emp => (emp.id === id ? { ...emp, [field]: value } : emp)));
    };

    const executeSaveChanges = async () => {
        if (!db) return;
        setSaveStatus('saving');
        const batch = writeBatch(db);
        employees.forEach(emp => {
            const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.id);
            const { id, ...data } = emp;
            batch.set(docRef, data, { merge: true });
        });
        try {
            await batch.commit();
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
        if (!db) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/employees`, id));
            setNotification({ message: t.employeeDeleted, type: 'success' });
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
                complete: (results) => {
                    setImportData(results.data);
                },
                error: () => {
                    setNotification({ message: t.importError, type: 'error' });
                }
            });
        }
    };
    
    const handleConfirmImport = async () => {
        if (!importData) return;
        const employeesCollectionRef = collection(db, `artifacts/${appId}/public/data/employees`);
        const batch = writeBatch(db);

        for (const record of importData) {
            const q = query(employeesCollectionRef, where("positionId", "==", record.positionId));
            const querySnapshot = await getDocs(q);
            const employeeData = {
                name: record.name,
                positionId: record.positionId,
                jobTitle: record.jobTitle,
                rate: Number(record.rate) || 0,
                baseSalary: Number(record.baseSalary) || 0,
                associatedStore: record.associatedStore,
            };

            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                const docRef = doc(db, `artifacts/${appId}/public/data/employees`, docId);
                batch.update(docRef, employeeData);
            } else {
                const newDocRef = doc(employeesCollectionRef);
                batch.set(newDocRef, employeeData);
            }
        }

        try {
            await batch.commit();
            setNotification({ message: t.importSuccess, type: 'success' });
        } catch (error) {
             setNotification({ message: t.importError, type: 'error' });
        } finally {
            setImportData(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
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
                                <tr key={emp.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-2"><input type="text" value={emp.name} onChange={e => handleEmployeeChange(emp.id, 'name', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><input type="text" value={emp.positionId} onChange={e => handleEmployeeChange(emp.id, 'positionId', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><select value={emp.jobTitle} onChange={e => handleEmployeeChange(emp.id, 'jobTitle', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1">{JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}</select></td>
                                    <td className="px-4 py-2"><input type="number" value={emp.rate} onChange={e => handleEmployeeChange(emp.id, 'rate', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><input type="number" value={emp.baseSalary} onChange={e => handleEmployeeChange(emp.id, 'baseSalary', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><select value={emp.associatedStore} onChange={e => handleEmployeeChange(emp.id, 'associatedStore', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1">{ALL_STORES.map(store => <option key={store} value={store}>{store}</option>)}</select></td>
                                    <td className="px-4 py-2"><button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button></td>
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