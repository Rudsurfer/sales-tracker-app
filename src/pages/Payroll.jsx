import React, { useState, useEffect, useMemo } from 'react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { formatCurrency } from '../utils/helpers';
import { TRANSACTION_TYPES } from '../constants';
import { Download } from 'lucide-react';
import Papa from 'papaparse';
import { translations } from '../translations';

export const Payroll = ({ allEmployees, selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t }) => {
    const [payrollData, setPayrollData] = useState([]);
    const [transfersInData, setTransfersInData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        const fetchPayrollData = async () => {
            setIsLoading(true);
            try {
                const [schedulesRes, salesRes, goalsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`),
                    fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`),
                    fetch(`${API_BASE_URL}/goals/${selectedStore}/${currentWeek}/${currentYear}`)
                ]);
                const schedules = await schedulesRes.json();
                const sales = await salesRes.json();
                const performanceGoals = await goalsRes.json();
                
                // ... (Logic to calculate payrollData and transfersInData from fetched data)

                setPayrollData(/* ... calculated data ... */);
                setTransfersInData(/* ... calculated data ... */);

            } catch (error) {
                console.error("Error fetching payroll data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayrollData();
    }, [selectedStore, currentWeek, currentYear, allEmployees, API_BASE_URL]);


    // ... (handlePayrollChange, totals calculation, and other logic remains the same)

    const handleExport = () => {
        const tEn = translations.en;
        const mainData = payrollData.map(row => {
            const newRow = {};
            payrollColumns.forEach(col => {
                newRow[tEn[col.field] || col.header] = row[col.field];
            });
            return newRow;
        });

        const transfersData = transfersInData.map(row => {
            const newRow = {};
            transfersInColumns.forEach(col => {
                newRow[tEn[col.field] || col.header] = row[col.field];
            });
            return newRow;
        });

        const mainCsv = Papa.unparse(mainData);
        const transfersCsv = Papa.unparse(transfersData);
        
        const csvString = `${tEn.payroll}\n${mainCsv}\n\n${tEn.transfersIn}\n${transfersCsv}`;

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `payroll_W${currentWeek}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    {/* ... */}
                    <div className="flex gap-4">
                        <button onClick={handleExport} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"><Download size={18} className="mr-2"/> {t.exportToCsv || 'Export to CSV'}</button>
                        <SaveButton onClick={() => setIsConfirmModalOpen(true)} saveState={saveState} text={t.savePayroll} />
                    </div>
                </div>
                {/* ... (rest of the JSX) */}
            </div>
            {/* ... */}
        </div>
    );
};
