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
    const [performanceGoals, setPerformanceGoals] = useState({});
    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });

    useEffect(() => {
        const fetchPayrollData = async () => {
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
                console.error("Error fetching payroll data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayrollData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    useEffect(() => {
        if (isLoading) return;

        const employeeSalesMap = new Map();
        (sales || []).forEach(sale => {
            (sale.items || []).forEach(item => {
                if (item.SalesRep) {
                    const currentSales = employeeSalesMap.get(item.SalesRep) || 0;
                    employeeSalesMap.set(item.SalesRep, currentSales + item.Subtotal);
                }
            });
        });

        const homeStoreEmployees = allEmployees.filter(e => e.StoreID === selectedStore);
        
        const allRelevantEmployeeNames = new Set([
            ...homeStoreEmployees.map(e => e.Name),
            ...Array.from(employeeSalesMap.keys())
        ]);
        
        const calculatedPayroll = Array.from(allRelevantEmployeeNames).map(name => {
            const emp = allEmployees.find(e => e.Name === name);
            if (!emp || emp.StoreID !== selectedStore) return null;

            let totalHours = 0;
            const workLocations = new Set();
            
            const scheduleRow = schedule.rows?.find(r => r.EmployeeID === emp.EmployeeID);
            if (scheduleRow) {
                totalHours = Object.values(scheduleRow.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                if(totalHours > 0) workLocations.add(selectedStore);
            }

            const totalSales = employeeSalesMap.get(name) || 0;
            
            const regularHours = Math.min(totalHours, 40);
            const otHours = Math.max(0, totalHours - 40);
            const commission = totalSales * 0.02; // Using 2% flat rate
            const base = emp.BaseSalary > 0 ? emp.BaseSalary / 52 : 0;
            const rate = emp.Rate || 0;
            const gross = (rate * regularHours) + (rate * 1.5 * otHours) + base + commission;
            
            return {
                id: emp.EmployeeID,
                payrollName: emp.Name,
                positionId: `FOLT000${emp.PositionID}`,
                jobTitleDescription: emp.JobTitle,
                workLocations: Array.from(workLocations).join(', '),
                commissionPlan: '2', // Hardcoded 2%
                rate: rate,
                base: base,
                regularHours,
                otHours,
                salesResults: totalSales,
                commission,
                weeklyGrossEarnings: gross,
                bonusPay: 0, adjHrs: 0, vacationHours: 0, adjCommissions: 0, ecommerceCommissions: 0, other: 0,
                retroPay: 0, payInLieuQC: 0, payInLieu: 0, finalTerminationPay: 0, comments: '', statHoliday: 0,
                personalHours: 0, sickHours: 0, subTotal: 0, adjustments: 0, statHolidayHours: 0,
            };
        }).filter(Boolean);

        setPayrollData(calculatedPayroll);
    }, [schedule, sales, allEmployees, selectedStore, isLoading]);


    const handlePayrollChange = (id, field, value) => {
        setPayrollData(currentData => currentData.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: Number(value) || value };
                const commissionRate = 0.02; // Hardcoded 2%
                newRow.commission = newRow.salesResults * commissionRate;
                const { rate, regularHours, otHours, bonusPay, adjHrs, vacationHours, personalHours, sickHours, statHolidayHours, base, commission, adjCommissions, ecommerceCommissions, other, retroPay, payInLieuQC, payInLieu, finalTerminationPay, statHoliday, subTotal, adjustments } = newRow;
                const gross = (Number(rate) * (Number(regularHours) + Number(adjHrs) + Number(vacationHours) + Number(personalHours) + Number(sickHours) + Number(statHolidayHours))) +
                              (Number(rate) * 1.5 * Number(otHours)) + Number(base) + Number(commission) + Number(bonusPay) + 
                              Number(adjCommissions) + Number(ecommerceCommissions) + Number(other) + Number(retroPay) + 
                              Number(payInLieuQC) + Number(payInLieu) + Number(finalTerminationPay) + Number(statHoliday) + 
                              Number(subTotal) + Number(adjustments);
                return { ...newRow, weeklyGrossEarnings: gross };
            }
            return row;
        }));
    };
    
    const { payrollPercentage, targetVsActual, payrollPercentageColor } = useMemo(() => {
        let totalCostForPercentage = 0;
        payrollData.forEach(row => {
            const emp = allEmployees.find(e => e.EmployeeID === row.id);
            if (emp && emp.BaseSalary > 0) {
                const effectiveHourlyRate = (emp.BaseSalary / 52) / 40;
                const totalHours = row.regularHours + row.otHours;
                totalCostForPercentage += (effectiveHourlyRate * totalHours);
            } else {
                totalCostForPercentage += (row.weeklyGrossEarnings - row.commission);
            }
        });

        const totalSales = payrollData.reduce((sum, row) => sum + row.salesResults, 0);
        const weeklyTarget = performanceGoals.WeeklySalesTarget || 0;
        
        const percentage = totalSales > 0 ? (totalCostForPercentage / totalSales) * 100 : 0;
        const difference = totalSales - weeklyTarget;
        
        let colorClass = 'text-green-400';
        if (percentage > 16 && percentage < 20) colorClass = 'text-yellow-400';
        else if (percentage >= 20) colorClass = 'text-red-400';
        
        return { payrollPercentage: percentage, targetVsActual: difference, payrollPercentageColor: colorClass };
    }, [payrollData, allEmployees, performanceGoals]);

    const handleSaveClick = () => setIsConfirmModalOpen(true);
    const handleConfirmSave = () => {
        // This will need to be connected to a backend endpoint
        console.log("Saving payroll data...", payrollData);
        setIsConfirmModalOpen(false);
    };

    const payrollColumns = [
        { header: 'Payroll Name', field: 'payrollName', readOnly: true, color: 'yellow', width: 'min-w-[180px]' },
        { header: 'Position ID', field: 'positionId', readOnly: true, color: 'yellow', width: 'min-w-[150px]' },
        { header: 'Job Title Description', field: 'jobTitleDescription', readOnly: true, color: 'yellow', width: 'min-w-[180px]' },
        { header: 'Work Locations', field: 'workLocations', readOnly: true, color: 'yellow', width: 'min-w-[200px]' },
        { header: 'COMMISSION PLAN', field: 'commissionPlan', type: 'text', color: 'yellow', width: 'min-w-[150px]', readOnly: true },
        { header: 'Rate', field: 'rate', readOnly: true, type: 'number', color: 'white', width: 'min-w-[100px]' },
        { header: 'Base', field: 'base', readOnly: true, type: 'number', color: 'white', width: 'min-w-[100px]' },
        { header: 'Commission $$$', field: 'commission', readOnly: true, type: 'number', color: 'green', width: 'min-w-[150px]' },
        { header: 'Regular Hours', field: 'regularHours', readOnly: true, type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'OT Hrs', field: 'otHours', readOnly: true, type: 'number', color: 'white', width: 'min-w-[100px]' },
        { header: 'Sales Results', field: 'salesResults', readOnly: true, type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Bonus Pay $$$', field: 'bonusPay', type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Sub-Total', field: 'subTotal', type: 'number', color: 'green', width: 'min-w-[120px]' },
        { header: 'Adjustments $$$', field: 'adjustments', type: 'number', color: 'green', width: 'min-w-[120px]' },
        { header: 'Weekly Gross Earnings', field: 'weeklyGrossEarnings', readOnly: true, type: 'number', color: 'pink', width: 'min-w-[180px]' },
        { header: 'ADJ HRS', field: 'adjHrs', type: 'number', color: 'white', width: 'min-w-[100px]' },
        { header: 'Stat Holiday Hours', field: 'statHolidayHours', type: 'number', color: 'green', width: 'min-w-[150px]' },
        { header: 'Vacation Hours', field: 'vacationHours', type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Adj. Commissions $$$', field: 'adjCommissions', type: 'number', color: 'white', width: 'min-w-[180px]' },
        { header: 'E-Commerce Commissions$$$', field: 'ecommerceCommissions', type: 'number', color: 'white', width: 'min-w-[200px]' },
        { header: 'Other $$$', field: 'other', type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Retro Pay $$$', field: 'retroPay', type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Pay in Lieu QC $$$', field: 'payInLieuQC', type: 'number', color: 'white', width: 'min-w-[150px]' },
        { header: 'Pay in Lieu $$$', field: 'payInLieu', type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Final Termination Pay $$$', field: 'finalTerminationPay', type: 'number', color: 'white', width: 'min-w-[200px]' },
        { header: 'Comments', field: 'comments', type: 'text', color: 'white', width: 'min-w-[200px]' },
        { header: 'Stat Holiday $$$', field: 'statHoliday', type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Personal Hours', field: 'personalHours', type: 'number', color: 'white', width: 'min-w-[120px]' },
        { header: 'Sick Hours', field: 'sickHours', type: 'number', color: 'white', width: 'min-w-[100px]' },
    ];

    const transfersInColumns = [
        { header: 'Associate Name', field: 'name' },
        { header: 'Position ID', field: 'positionId' },
        { header: 'Home Store', field: 'homeStore' },
        { header: 'Hours Worked', field: 'hoursWorked', type: 'number', format: v => v.toFixed(2) },
        { header: 'Sales', field: 'sales', type: 'currency' },
        { header: 'Rate', field: 'rate', type: 'currency' },
        { header: 'Earnings', field: 'earnings', type: 'currency' },
        { header: 'Commission $', field: 'commission', type: 'currency' },
        { header: 'Total Wages', field: 'totalWages', type: 'currency' },
    ];

    const mainTableTotals = useMemo(() => {
        const totals = {};
        payrollColumns.forEach(col => {
            if(col.type === 'number') {
                totals[col.field] = payrollData.reduce((acc, row) => acc + (Number(row[col.field]) || 0), 0);
            }
        });
        return totals;
    }, [payrollData]);

    const transfersInTotals = useMemo(() => {
        const totals = {};
        transfersInColumns.forEach(col => {
            if(col.type === 'number' || col.type === 'currency') {
                totals[col.field] = transfersInData.reduce((acc, row) => acc + (Number(row[col.field]) || 0), 0);
            }
        });
        return totals;
    }, [transfersInData]);

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
                    <div>
                        <h2 className="text-2xl font-bold text-white">{t.payroll}</h2>
                        <div className="flex items-center gap-6 mt-2">
                             <div className="text-center">
                                <p className="text-sm text-gray-400">{t.payrollPercentage}</p>
                                <p className={`text-2xl font-bold ${payrollPercentageColor}`}>{payrollPercentage.toFixed(2)}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">{t.targetVsActual}</p>
                                <p className={`text-2xl font-bold ${targetVsActual >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(targetVsActual)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleExport} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"><Download size={18} className="mr-2"/> {t.exportToCsv || 'Export to CSV'}</button>
                        <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.savePayroll} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400 border-collapse">
                        <thead className="text-xs text-gray-300 uppercase">
                            <tr>
                                {payrollColumns.map(col => (
                                    <th key={col.field} scope="col" className={`px-2 py-3 sticky top-0 bg-gray-700 z-10 border border-gray-600 ${col.color === 'yellow' ? 'bg-yellow-900/50' : col.color === 'green' ? 'bg-green-900/50' : col.color === 'pink' ? 'bg-pink-900/50' : 'bg-gray-700'}`}>
                                        <div className={col.width}>{t[col.field] || col.header}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {payrollData.map(row => (
                                <tr key={row.id} className="bg-gray-800 border-b border-gray-700">
                                    {payrollColumns.map(col => (
                                        <td key={col.field} className={`px-1 py-1 border border-gray-700 ${col.color === 'yellow' ? 'bg-yellow-800/20' : col.color === 'green' ? 'bg-green-800/20' : col.color === 'pink' ? 'bg-pink-800/20' : ''}`}>
                                            {col.readOnly ? (
                                                <span className={`px-2 py-1 block ${col.width}`}>{col.field.includes('$$$') || ['rate', 'base', 'weeklyGrossEarnings', 'salesResults', 'commission'].includes(col.field) ? formatCurrency(row[col.field]) : row[col.field]}</span>
                                            ) : col.field === 'commissionPlan' ? (
                                                <div className={`relative ${col.width}`}>
                                                    <input type="text" value={row[col.field]} onChange={(e) => handlePayrollChange(row.id, col.field, e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded-md px-2 py-1 pr-4" />
                                                    <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">%</span>
                                                </div>
                                            ) : (
                                                <input type={col.type || 'text'} value={row[col.field]} onChange={(e) => handlePayrollChange(row.id, col.field, e.target.value)} className={`w-full bg-transparent focus:bg-gray-900 outline-none rounded-md px-2 py-1 ${col.width}`} />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="text-white font-bold bg-gray-700">
                            <tr>
                                 {payrollColumns.map(col => (
                                    <td key={col.field} className="px-2 py-2 text-right border border-gray-600">
                                        {col.type === 'number' ? (['rate', 'base', 'weeklyGrossEarnings', 'salesResults', 'commission'].includes(col.field) || col.header.includes('$$$') ? formatCurrency(mainTableTotals[col.field]) : mainTableTotals[col.field].toFixed(2)) : (col.field === 'payrollName' ? t.totals : '')}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">{t.transfersIn}</h3>
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                {transfersInColumns.map(col => (
                                    <th key={col.field} className="px-4 py-3">{t[col.field] || col.header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transfersInData.map((row, index) => (
                                <tr key={index} className="bg-gray-800 border-b border-gray-700">
                                    {transfersInColumns.map(col => (
                                        <td key={col.field} className="px-4 py-2">
                                            {col.type === 'currency' ? formatCurrency(row[col.field]) : col.format ? col.format(row[col.field]) : row[col.field]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="text-white font-bold bg-gray-700">
                            <tr>
                                {transfersInColumns.map(col => (
                                    <td key={col.field} className="px-4 py-3 text-left">
                                        {col.field === 'name' ? t.totals : (col.type === 'currency' || col.type === 'number') ? <strong>{col.type === 'currency' ? formatCurrency(transfersInTotals[col.field]) : transfersInTotals[col.field].toFixed(2)}</strong> : ''}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
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
