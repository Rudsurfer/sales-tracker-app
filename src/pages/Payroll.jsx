import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { formatCurrency } from '../utils/helpers';
import { TRANSACTION_TYPES } from '../constants';

export const Payroll = ({ allSchedules, allSales, allEmployees, performanceGoals, selectedStore, currentWeek, currentYear, db, appId, setNotification, t }) => {
    const [payrollData, setPayrollData] = useState([]);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const homeStoreEmployees = useMemo(() => allEmployees.filter(e => e.associatedStore === selectedStore), [allEmployees, selectedStore]);
    const transfersIn = useMemo(() => {
        const guestAssociateIds = new Set();
        const currentSchedule = allSchedules.find(s => s.storeId === selectedStore);
        if (currentSchedule) {
            currentSchedule.rows.forEach(row => {
                const emp = allEmployees.find(e => e.id === row.id);
                if (emp && emp.associatedStore !== selectedStore) {
                    guestAssociateIds.add(emp.id);
                }
            });
        }
        return allEmployees.filter(e => guestAssociateIds.has(e.id));
    }, [allSchedules, allEmployees, selectedStore]);

    useEffect(() => {
        const calculatePayroll = () => {
            const data = homeStoreEmployees.map(emp => {
                let totalHours = 0;
                let totalSales = 0;
                const workLocations = new Set();

                allSchedules.forEach(sched => {
                    const row = sched.rows.find(r => r.id === emp.id);
                    if (row) {
                        totalHours += Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                        if (totalHours > 0) {
                             workLocations.add(`${sched.storeId} (${sched.storeId === emp.associatedStore ? 'Home' : 'Guest'})`);
                        }
                    }
                });

                allSales.forEach(sale => {
                     (sale.items || []).forEach(item => {
                        if (item.salesRep === emp.name) {
                            const itemValue = item.total || (item.price * item.quantity);
                            totalSales += itemValue;
                        }
                    });
                });
                
                const regularHours = Math.min(totalHours, 40);
                const otHours = Math.max(0, totalHours - 40);
                const commission = totalSales * (parseFloat(emp.commissionPlan || '2') / 100);
                const base = emp.baseSalary / 52;
                const gross = (emp.rate * regularHours) + (emp.rate * 1.5 * otHours) + base + commission;

                return {
                    id: emp.id,
                    payrollName: emp.name,
                    positionId: `FOLT000${emp.positionId}`,
                    jobTitleDescription: emp.jobTitle,
                    workLocations: Array.from(workLocations).join(', '),
                    commissionPlan: emp.commissionPlan || '2',
                    rate: emp.rate || 0,
                    base: base || 0,
                    regularHours,
                    otHours,
                    salesResults: totalSales,
                    commission,
                    weeklyGrossEarnings: gross
                };
            });
            setPayrollData(data);
        };
        calculatePayroll();
    }, [homeStoreEmployees, allSchedules, allSales]);
    
    const { payrollPercentage, targetVsActual } = useMemo(() => {
        const totalPayroll = payrollData.reduce((sum, emp) => sum + emp.weeklyGrossEarnings, 0);
        const totalSales = allSales.filter(s => s.storeId === selectedStore && s.type !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.total, 0);
        const weeklyTarget = performanceGoals.weeklySalesTarget || 0;
        
        const percentage = totalSales > 0 ? (totalPayroll / totalSales) * 100 : 0;
        const difference = totalSales - weeklyTarget;
        
        return { payrollPercentage: percentage, targetVsActual: difference };
    }, [payrollData, allSales, selectedStore, performanceGoals]);

    const handleSaveClick = () => setIsConfirmModalOpen(true);
    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        // Placeholder for save logic
    };

    const transfersInData = useMemo(() => {
        return transfersIn.map(emp => {
            let hoursWorked = 0;
            let sales = 0;
            const currentSchedule = allSchedules.find(s => s.storeId === selectedStore);
            if(currentSchedule){
                const row = currentSchedule.rows.find(r => r.id === emp.id);
                if(row) hoursWorked = Object.values(row.actualHours || {}).reduce((s, h) => s + Number(h), 0);
            }
            allSales.filter(s => s.storeId === selectedStore).forEach(sale => {
                (sale.items || []).forEach(item => {
                    if (item.salesRep === emp.name) {
                         sales += item.total || (item.price * item.quantity);
                    }
                });
            });
            const earnings = hoursWorked * emp.rate;
            const commission = sales * (parseFloat(emp.commissionPlan || '2') / 100);

            return {
                name: emp.name,
                positionId: `FOLT000${emp.positionId}`,
                homeStore: emp.associatedStore,
                hoursWorked,
                sales,
                rate: emp.rate,
                earnings,
                commission,
                totalWages: earnings + commission
            }
        })
    }, [transfersIn, allSchedules, allSales, selectedStore]);
    
    const payrollColumns = [
        { header: 'Payroll Name', field: 'payrollName', color: 'yellow', readOnly: true, width: 'min-w-[180px]' },
        { header: 'Position ID', field: 'positionId', color: 'yellow', readOnly: true, width: 'min-w-[150px]' },
        { header: 'Job Title Description', field: 'jobTitleDescription', color: 'yellow', readOnly: true, width: 'min-w-[180px]' },
        { header: 'Work Locations', field: 'workLocations', color: 'yellow', readOnly: true, width: 'min-w-[200px]' },
        { header: 'COMMISSION PLAN', field: 'commissionPlan', color: 'yellow', type: 'text', width: 'min-w-[150px]' },
        { header: 'Rate', field: 'rate', color: 'white', type: 'number', width: 'min-w-[100px]' },
        { header: 'Base', field: 'base', color: 'white', type: 'number', width: 'min-w-[120px]' },
        { header: 'Commission $$$', field: 'commission', color: 'green', type: 'number', readOnly: true, width: 'min-w-[150px]' },
        { header: 'Regular Hours', field: 'regularHours', color: 'white', type: 'number', readOnly: true, width: 'min-w-[120px]' },
        { header: 'OT Hrs', field: 'otHours', color: 'white', type: 'number', readOnly: true, width: 'min-w-[100px]' },
        { header: 'Sales Results', field: 'salesResults', color: 'white', type: 'number', readOnly: true, width: 'min-w-[150px]' },
        { header: 'Weekly Gross Earnings', field: 'weeklyGrossEarnings', color: 'pink', type: 'number', readOnly: true, width: 'min-w-[200px]' },
    ];

    return (
        <>
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{t.payroll}</h2>
                    <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="text-sm text-gray-400">{t.payrollPercentage}</p>
                            <p className="text-2xl font-bold">{payrollPercentage.toFixed(2)}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">{t.targetVsActual}</p>
                            <p className={`text-2xl font-bold ${targetVsActual >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(targetVsActual)}</p>
                        </div>
                        <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.savePayroll} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400 border-collapse">
                        <thead className="text-xs text-gray-300 uppercase">
                            <tr>
                                {payrollColumns.map(col => (
                                    <th key={col.field} scope="col" className={`px-2 py-3 sticky top-0 z-10 border border-gray-600 ${col.color === 'yellow' ? 'bg-yellow-900/50' : col.color === 'green' ? 'bg-green-900/50' : col.color === 'pink' ? 'bg-pink-900/50' : 'bg-gray-700'} ${col.width}`}>
                                        {t[col.field] || col.header}
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
                                                <span className="px-2 py-1 block">{col.field.includes('$$$') || ['rate', 'base', 'weeklyGrossEarnings', 'salesResults', 'commission'].includes(col.field) ? formatCurrency(row[col.field]) : row[col.field]}</span>
                                            ) : (
                                                <input
                                                    type={col.type || 'text'}
                                                    value={row[col.field]}
                                                    readOnly // Make all fields read-only for now
                                                    className="w-full bg-transparent outline-none rounded-md px-2 py-1"
                                                />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {transfersInData.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.transfersIn}</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">{t.employeeName}</th>
                                    <th className="px-4 py-3">{t.positionId}</th>
                                    <th className="px-4 py-3">{t.homeStore}</th>
                                    <th className="px-4 py-3 text-right">{t.hrs}</th>
                                    <th className="px-4 py-3 text-right">{t.sales}</th>
                                    <th className="px-4 py-3 text-right">{t.rate}</th>
                                    <th className="px-4 py-3 text-right">{t.earnings}</th>
                                    <th className="px-4 py-3 text-right">{t.commission}</th>
                                    <th className="px-4 py-3 text-right">{t.totalWages}</th>
                                </tr>
                            </thead>
                             <tbody>
                                {transfersInData.map((row, index) => (
                                    <tr key={index} className="bg-gray-800 border-b border-gray-700">
                                        <td className="px-4 py-2 font-medium">{row.name}</td>
                                        <td className="px-4 py-2">{row.positionId}</td>
                                        <td className="px-4 py-2">{row.homeStore}</td>
                                        <td className="px-4 py-2 text-right">{row.hoursWorked.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(row.sales)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(row.rate)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(row.earnings)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(row.commission)}</td>
                                        <td className="px-4 py-2 text-right font-bold">{formatCurrency(row.totalWages)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
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
        </>
    );
};
