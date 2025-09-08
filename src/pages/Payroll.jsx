import React, { useState, useEffect, useMemo } from 'react';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { formatCurrency } from '../utils/helpers';
import { TRANSACTION_TYPES } from '../constants';
import { Download } from 'lucide-react';
import Papa from 'papaparse';

export const Payroll = ({ allEmployees, selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t }) => {
    const [payrollData, setPayrollData] = useState([]);
    const [transfersInData, setTransfersInData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [performanceGoals, setPerformanceGoals] = useState({});
    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });

    useEffect(() => {
        const fetchPayrollData = async () => {
            if (!selectedStore || !currentWeek || !currentYear) return;
            setIsLoading(true);
            try {
                const [scheduleRes, salesRes, goalsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/goals/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json())
                ]);

                setSchedule(scheduleRes.status === 'not_found' ? { rows: [] } : scheduleRes);
                setSales(Array.isArray(salesRes) ? salesRes : []);
                setPerformanceGoals(goalsRes.status === 'not_found' ? {} : goalsRes);

            } catch (error) {
                console.error("Error fetching payroll data dependencies:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayrollData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const processedPayrollData = useMemo(() => {
        const homeStoreEmployees = allEmployees.filter(e => e.StoreID === selectedStore);
        const employeeData = homeStoreEmployees.map(emp => {
            const scheduleRow = schedule.rows?.find(r => r.EmployeeID === emp.EmployeeID);
            const totalHours = scheduleRow ? Object.values(scheduleRow.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0) : 0;
            const regularHours = Math.min(totalHours, 40);
            const otHours = Math.max(0, totalHours - 40);

            const employeeSales = sales
                .flatMap(s => s.items || [])
                .filter(item => item.SalesRep === emp.Name)
                .reduce((sum, item) => sum + item.Subtotal, 0);

            let grossEarnings;
            if (emp.BaseSalary > 0) {
                grossEarnings = (emp.BaseSalary / 52);
            } else {
                grossEarnings = (emp.Rate * regularHours) + (emp.Rate * 1.5 * otHours);
            }

            return {
                ...emp,
                totalHours,
                regularHours,
                otHours,
                employeeSales,
                commission: 0, // Placeholder
                weeklyGrossEarnings: grossEarnings,
            };
        });

        // transfers in logic can be added here if needed

        return employeeData;

    }, [allEmployees, selectedStore, schedule, sales]);

     const { payrollPercentage, targetVsActual, payrollPercentageColor } = useMemo(() => {
        const totalSales = sales.filter(s => s.Type_ !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.TotalAmount, 0);
        const weeklyTarget = performanceGoals.WeeklySalesTarget || 0;
        
        let totalCostForPercentage = processedPayrollData.reduce((sum, emp) => sum + emp.weeklyGrossEarnings, 0);

        const percentage = totalSales > 0 ? (totalCostForPercentage / totalSales) * 100 : 0;
        const difference = totalSales - weeklyTarget;

        let colorClass = 'text-green-400';
        if (percentage > 16 && percentage < 20) colorClass = 'text-yellow-400';
        else if (percentage >= 20) colorClass = 'text-red-400';
        
        return { payrollPercentage: percentage, targetVsActual: difference, payrollPercentageColor: colorClass };
    }, [processedPayrollData, sales, performanceGoals]);

    const handleConfirmSave = () => {
        console.log("Saving payroll data...");
        setIsConfirmModalOpen(false);
    };

    const handleDownload = () => {
         const dataToExport = processedPayrollData.map(emp => ({
            'Name': emp.Name,
            'Position ID': emp.PositionID,
            'Job Title': emp.JobTitle,
            'Total Hours': emp.totalHours.toFixed(2),
            'Regular Hours': emp.regularHours.toFixed(2),
            'OT Hours': emp.otHours.toFixed(2),
            'Rate': emp.Rate,
            'Base Salary': emp.BaseSalary,
            'Gross Earnings': emp.weeklyGrossEarnings.toFixed(2)
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `payroll_${selectedStore}_${currentWeek}_${currentYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    const homeStoreColumns = [
        { header: t.payrollName, field: 'Name' },
        { header: t.positionId, field: 'PositionID' },
        { header: t.jobTitleDescription, field: 'JobTitle' },
        { header: t.totalHours, field: 'totalHours', format: (v) => v.toFixed(2) },
        { header: t.regularHours, field: 'regularHours', format: (v) => v.toFixed(2) },
        { header: t.otHours, field: 'otHours', format: (v) => v.toFixed(2) },
        { header: t.rate, field: 'Rate', type: 'currency' },
        { header: t.baseSalary, field: 'BaseSalary', type: 'currency' },
        { header: t.grossEarnings, field: 'weeklyGrossEarnings', type: 'currency' },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-800 p-3 rounded-lg">
                        <span className="text-sm text-gray-400">{t.payrollPercentage}</span>
                        <p className={`text-2xl font-bold ${payrollPercentageColor}`}>{payrollPercentage.toFixed(2)}%</p>
                    </div>
                     <div className="bg-gray-800 p-3 rounded-lg">
                        <span className="text-sm text-gray-400">{t.targetVsActual}</span>
                        <p className={`text-2xl font-bold ${targetVsActual < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(targetVsActual)}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleDownload} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"><Download size={18} className="mr-2" /> {t.download}</button>
                    <SaveButton onClick={() => setIsConfirmModalOpen(true)} saveState={saveState} text={t.savePayroll} />
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4">{t.homeStoreAssociates}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                           <tr>{homeStoreColumns.map(c => <th key={c.field} className="px-4 py-3">{c.header}</th>)}</tr>
                        </thead>
                        <tbody>
                            {processedPayrollData.map(row => (
                                <tr key={row.EmployeeID} className="bg-gray-800 border-b border-gray-700">
                                    {homeStoreColumns.map(col => (
                                        <td key={col.field} className="px-4 py-3 whitespace-nowrap">
                                            {col.type === 'currency' ? formatCurrency(row[col.field]) : col.format ? col.format(row[col.field]) : row[col.field]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSavePayroll}
                t={t}
            >
                <p>{t.confirmSavePayrollMsg}</p>
            </ConfirmationModal>
        </div>
    );
};
