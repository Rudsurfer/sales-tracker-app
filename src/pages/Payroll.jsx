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
            if(!homeStoreEmployees.length) return;

            const data = homeStoreEmployees.map(emp => {
                let totalHours = 0;
                let totalSales = 0;
                const workLocations = new Set();

                allSchedules.forEach(sched => {
                    const row = sched.rows.find(r => r.id === emp.id);
                    if (row) {
                        const hoursInSched = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                        if (hoursInSched > 0) {
                             workLocations.add(`${sched.storeId} (${sched.storeId === emp.associatedStore ? 'Home' : 'Guest'})`);
                        }
                        totalHours += hoursInSched;
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
                const base = emp.baseSalary ? emp.baseSalary / 52 : 0;
                const rate = emp.rate || 0;
                const gross = (rate * regularHours) + (rate * 1.5 * otHours) + base + commission;

                // For now, these are placeholders for manual entry
                const initialPayrollEntry = {
                    bonusPay: 0,
                    adjHrs: 0,
                    vacationHours: 0,
                    adjCommissions: 0,
                    ecommerceCommissions: 0,
                    other: 0,
                    retroPay: 0,
                    payInLieuQC: 0,
                    payInLieu: 0,
                    finalTerminationPay: 0,
                    comments: '',
                    statHoliday: 0,
                    personalHours: 0,
                    sickHours: 0,
                    subTotal: 0,
                    adjustments: 0,
                    statHolidayHours: 0,
                };
                
                return {
                    id: emp.id,
                    payrollName: emp.name,
                    positionId: `FOLT000${emp.positionId}`,
                    jobTitleDescription: emp.jobTitle,
                    workLocations: Array.from(workLocations).join(', '),
                    commissionPlan: emp.commissionPlan || '2',
                    rate: rate,
                    base: base,
                    regularHours,
                    otHours,
                    salesResults: totalSales,
                    commission,
                    weeklyGrossEarnings: gross,
                    ...initialPayrollEntry
                };
            });
            setPayrollData(data);
        };
        calculatePayroll();
    }, [homeStoreEmployees, allSchedules, allSales]);

    const handlePayrollChange = (id, field, value) => {
        setPayrollData(currentData => currentData.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: value };
                
                const commissionRate = parseFloat(newRow.commissionPlan) / 100;
                newRow.commission = !isNaN(commissionRate) ? newRow.salesResults * commissionRate : 0;
                
                const { rate, regularHours, otHours, bonusPay, adjHrs, vacationHours, personalHours, sickHours, statHolidayHours, base, commission, adjCommissions, ecommerceCommissions, other, retroPay, payInLieuQC, payInLieu, finalTerminationPay, statHoliday, subTotal, adjustments } = newRow;
                
                const gross = (Number(rate) * (Number(regularHours) + Number(adjHrs) + Number(vacationHours) + Number(personalHours) + Number(sickHours) + Number(statHolidayHours))) +
                              (Number(rate) * 1.5 * Number(otHours)) +
                              Number(base) +
                              Number(commission) +
                              Number(bonusPay) + 
                              Number(adjCommissions) + 
                              Number(ecommerceCommissions) + 
                              Number(other) + 
                              Number(retroPay) + 
                              Number(payInLieuQC) + 
                              Number(payInLieu) + 
                              Number(finalTerminationPay) + 
                              Number(statHoliday) + 
                              Number(subTotal) + 
                              Number(adjustments);
                return { ...newRow, weeklyGrossEarnings: gross };
            }
            return row;
        }));
    };
    
    const { payrollPercentage, targetVsActual, payrollPercentageColor } = useMemo(() => {
        const totalPayroll = payrollData.reduce((sum, emp) => sum + emp.weeklyGrossEarnings, 0);
        const totalSales = allSales.filter(s => s.storeId === selectedStore && s.type !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.total, 0);
        const weeklyTarget = performanceGoals.weeklySalesTarget || 0;
        
        const percentage = totalSales > 0 ? (totalPayroll / totalSales) * 100 : 0;
        const difference = totalSales - weeklyTarget;
        
        let colorClass = 'text-green-400';
        if (percentage > 16 && percentage < 20) {
            colorClass = 'text-yellow-400';
        } else if (percentage >= 20) {
            colorClass = 'text-red-400';
        }
        
        return { payrollPercentage: percentage, targetVsActual: difference, payrollPercentageColor: colorClass };
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
        { header: 'Bonus Pay $$$', field: 'bonusPay', color: 'white', type: 'number' },
        { header: 'Sub-Total', field: 'subTotal', color: 'green', type: 'number' },
        { header: 'Adjustments $$$', field: 'adjustments', color: 'green', type: 'number' },
        { header: 'Weekly Gross Earnings', field: 'weeklyGrossEarnings', color: 'pink', type: 'number', readOnly: true, width: 'min-w-[200px]' },
        { header: 'ADJ HRS', field: 'adjHrs', color: 'white', type: 'number' },
        { header: 'Stat Holiday Hours', field: 'statHolidayHours', color: 'green', type: 'number' },
        { header: 'Vacation Hours', field: 'vacationHours', color: 'white', type: 'number' },
        { header: 'Adj. Commissions $$$', field: 'adjCommissions', color: 'white', type: 'number' },
        { header: 'E-Commerce Commissions$$$', field: 'ecommerceCommissions', color: 'white', type: 'number' },
        { header: 'Other $$$', field: 'other', color: 'white', type: 'number' },
        { header: 'Retro Pay $$$', field: 'retroPay', color: 'white', type: 'number' },
        { header: 'Pay in Lieu QC $$$', field: 'payInLieuQC', color: 'white', type: 'number' },
        { header: 'Pay in Lieu $$$', field: 'payInLieu', color: 'white', type: 'number' },
        { header: 'Final Termination Pay $$$', field: 'finalTerminationPay', color: 'white', type: 'number' },
        { header: 'Comments', field: 'comments', color: 'white', type: 'text', width: 'min-w-[200px]' },
        { header: 'Stat Holiday $$$', field: 'statHoliday', color: 'white', type: 'number' },
        { header: 'Personal Hours', field: 'personalHours', color: 'white', type: 'number' },
        { header: 'Sick Hours', field: 'sickHours', color: 'white', type: 'number' },
    ];

    const mainTableTotals = useMemo(() => {
        const totals = {};
        payrollColumns.forEach(col => {
            if (col.type === 'number') {
                totals[col.field] = payrollData.reduce((sum, row) => sum + (Number(row[col.field]) || 0), 0);
            }
        });
        return totals;
    }, [payrollData, payrollColumns]);

    const transfersInTotals = useMemo(() => {
        return {
            hoursWorked: transfersInData.reduce((sum, row) => sum + row.hoursWorked, 0),
            sales: transfersInData.reduce((sum, row) => sum + row.sales, 0),
            earnings: transfersInData.reduce((sum, row) => sum + row.earnings, 0),
            commission: transfersInData.reduce((sum, row) => sum + row.commission, 0),
            totalWages: transfersInData.reduce((sum, row) => sum + row.totalWages, 0),
        }
    }, [transfersInData]);

    return (
        <>
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{t.payroll}</h2>
                    <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="text-sm text-gray-400">{t.payrollPercentage}</p>
                            <p className={`text-2xl font-bold ${payrollPercentageColor}`}>{payrollPercentage.toFixed(2)}%</p>
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
                                                <span className="px-2 py-1 block truncate">{col.field.includes('$$$') || ['rate', 'base', 'weeklyGrossEarnings', 'salesResults', 'commission'].includes(col.field) ? formatCurrency(row[col.field]) : row[col.field]}</span>
                                            ) : (
                                                <input
                                                    type={col.type || 'text'}
                                                    value={row[col.field]}
                                                    onChange={(e) => handlePayrollChange(row.id, col.field, e.target.value)}
                                                    className="w-full bg-transparent outline-none rounded-md px-2 py-1"
                                                />
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
                                        {col.type === 'number' ? (
                                            ['rate', 'base', 'weeklyGrossEarnings', 'salesResults', 'commission'].includes(col.field) || col.header.includes('$$$') ? 
                                            formatCurrency(mainTableTotals[col.field]) : 
                                            mainTableTotals[col.field]?.toFixed(2)
                                        ) : (col.field === 'payrollName' ? t.totals : '')}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
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
                            <tfoot className="text-white font-bold bg-gray-700">
                                <tr>
                                    <td colSpan="3" className="px-4 py-2 font-bold">{t.totals}</td>
                                    <td className="px-4 py-2 text-right font-bold">{transfersInTotals.hoursWorked.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(transfersInTotals.sales)}</td>
                                    <td className="px-4 py-2"></td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(transfersInTotals.earnings)}</td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(transfersInTotals.commission)}</td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(transfersInTotals.totalWages)}</td>
                                </tr>
                            </tfoot>
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
