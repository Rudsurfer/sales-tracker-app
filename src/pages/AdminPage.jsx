import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, doc, writeBatch, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { Users, LogOut, PlusCircle, Trash2, Upload } from 'lucide-react';
import { ALL_STORES, JOB_TITLES } from '../constants';
import { SaveButton, ConfirmationModal } from '../components/ui';
import Papa from 'papaparse';

export const AdminPage = ({ onExit, t, db, appId, setNotification, allEmployees: initialEmployees }) => {
    const [employees, setEmployees] = useState([]);
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        positionId: '',
        jobTitle: JOB_TITLES[0],
        rate: 0,
        baseSalary: 0,
        associatedStore: ALL_STORES[0],
    });
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [importData, setImportData] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setEmployees(initialEmployees);
    }, [initialEmployees]);

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
            await addDoc(employeesCollectionRef, {
                ...newEmployee,
                rate: Number(newEmployee.rate),
                baseSalary: Number(newEmployee.baseSalary)
            });
            setNewEmployee({
                name: '',
                positionId: '',
                jobTitle: JOB_TITLES[0],
                rate: 0,
                baseSalary: 0,
                associatedStore: ALL_STORES[0],
            });
            setNotification({ message: t.employeeAddedSuccess, type: 'success' });
        } catch (error) {
            console.error("Error adding employee:", error);
            setNotification({ message: t.errorAddingEmployee, type: 'error' });
        }
    };

    const handleEmployeeChange = (id, field, value) => {
        setEmployees(current => current.map(emp => {
            if (emp.id === id) {
                return { ...emp, [field]: value };
            }
            return emp;
        }));
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
            setNotification({ message: t.saveChangesSuccess, type: 'success' });
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Error saving changes:", error);
            setNotification({ message: t.errorSavingChanges, type: 'error' });
            setSaveStatus('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSaveChanges();
    };
    
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

    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedData = results.data.map(row => ({
                        name: row.name,
                        positionId: row.positionId,
                        jobTitle: row.jobTitle,
                        rate: Number(row.rate) || 0,
                        baseSalary: Number(row.baseSalary) || 0,
                        associatedStore: row.associatedStore,
                    }));
                    setImportData(parsedData);
                },
                error: () => {
                    setNotification({ message: t.importError, type: 'error' });
                }
            });
        }
    };

    const executeImport = async () => {
        if (!db || !importData) return;
        const employeesCollectionRef = collection(db, `artifacts/${appId}/public/data/employees`);
        const batch = writeBatch(db);
        
        const existingPositionIds = new Map(employees.map(e => [e.positionId, e.id]));

        for (const emp of importData) {
            if (existingPositionIds.has(emp.positionId)) {
                const docId = existingPositionIds.get(emp.positionId);
                const docRef = doc(employeesCollectionRef, docId);
                batch.set(docRef, emp, { merge: true });
            } else {
                const newDocRef = doc(employeesCollectionRef);
                batch.set(newDocRef, emp);
            }
        }

        try {
            await batch.commit();
            setNotification({ message: t.importSuccess, type: 'success' });
            setImportData(null);
        } catch (error) {
            console.error("Error importing data:", error);
            setNotification({ message: t.importError, type: 'error' });
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8 font-sans">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <Users className="mr-3" />
                    {t.employeeDatabase}
                </h1>
                <button onClick={onExit} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    <LogOut size={18} className="mr-2" />
                    {t.exit}
                </button>
            </header>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-end mb-4 gap-4">
                     <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
                     <button onClick={() => fileInputRef.current.click()} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                        <Upload size={18} className="mr-2" />
                        {t.importFromCsv}
                     </button>
                     <SaveButton onClick={handleSaveClick} saveState={saveStatus} text={t.saveChanges} />
                </div>
                {/* ... (rest of JSX) */}
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSave}
                t={t}
            >
                <p>{t.confirmSaveEmployeeDb}</p>
            </ConfirmationModal>
            
            <ConfirmationModal
                isOpen={!!importData}
                onClose={() => setImportData(null)}
                onConfirm={executeImport}
                title={t.importPreview}
                t={t}
            >
                <div>
                    <p className="mb-4">You are about to import {importData?.length} records. This will update existing employees and create new ones. Please review the data below.</p>
                    <div className="max-h-64 overflow-y-auto text-left text-sm bg-gray-900 p-2 rounded">
                        <pre>{JSON.stringify(importData, null, 2)}</pre>
                    </div>
                </div>
            </ConfirmationModal>
        </div>
    );
};
