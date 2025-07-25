import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { SaveButton, ConfirmationModal } from '../components/ui';
import { formatCurrency } from '../utils/helpers';

export const Payroll = ({ allSchedules, allSales, allEmployees, payroll, currentWeek, currentYear, db, appId, selectedStore, setNotification, t, performanceGoals }) => {
    const [payrollData, setPayrollData] = useState([]);
    const [transfersInData, setTransfersInData] = useState([]);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        if (!allEmployees.length || !allSchedules.length) return;

        const homeStoreEmployees = allEmployees.filter(e => e.associatedStore === selectedStore);
        
        const homeStorePayroll = homeStoreEmployees.map(emp => {
            let totalHours = 0;
            let totalSales = 0;
            const workLocations = new Set();
            
            allSchedules.forEach(sched => {
                const row = sched.rows.find(r => r.id === emp.id);
                if (row) {
                    totalHours += Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                    workLocations.add(`${sched.storeId} ${sched.storeId === emp.associatedStore ? '(Home)' : '(Guest)'}`);
                }
            });

            allSales.forEach(sale => {
                (sale.items || []).forEach(item => {
                    if (item.salesRep === emp.name) {
                        totalSales += item.total || (item.price * item.quantity);
                    }
                });
            });

            const existingPayroll = payroll.rows?.find(p => p.id === emp.id) || {};
            const regularHours = Math.min(totalHours, 40);
            const otHours = Math.max(0, totalHours - 40);
            const commission = totalSales * (parseFloat(emp.commissionPlan || '2') / 100);

            const newRow = {
                id: emp.id,
                payrollName: emp.name,
                positionId: emp.positionId,
                jobTitleDescription: emp.jobTitle,
                workLocations: Array.from(workLocations).join(', '),
                rate: existingPayroll.rate !== undefined ? existingPayroll.rate : emp.rate,
                base: existingPayroll.base !== undefined ? existingPayroll.base : emp.baseSalary / 52,
                regularHours,
                otHours,
                salesResults: totalSales,
                commission,
                bonusPay: existingPayroll.bonusPay || 0,
                adjHrs: existingPayroll.adjHrs || 0,
                vacationHours: existingPayroll.vacationHours || 0,
                adjCommissions: existingPayroll.adjCommissions || 0,
                ecommerceCommissions: existingPayroll.ecommerceCommissions || 0,
                other: existingPayroll.other || 0,
                retroPay: existingPayroll.retroPay || 0,
                payInLieuQC: existingPayroll.payInLieuQC || 0,
                payInLieu: existingPayroll.payInLieu || 0,
                finalTerminationPay: existingPayroll.finalTerminationPay || 0,
                comments: existingPayroll.comments || '',
                statHoliday: existingPayroll.statHoliday || 0,
                personalHours: existingPayroll.personalHours || 0,
                sickHours: existingPayroll.sickHours || 0,
                subTotal: existingPayroll.subTotal || 0,
                adjustments: existingPayroll.adjustments || 0,
                statHolidayHours: existingPayroll.statHolidayHours || 0,
            };

            const gross = (Number(newRow.rate) * (regularHours + newRow.adjHrs + newRow.vacationHours + newRow.personalHours + newRow.sickHours + newRow.statHolidayHours)) +
                          (Number(newRow.rate) * 1.5 * otHours) +
                          Number(newRow.base) + Number(newRow.commission) + Number(newRow.bonusPay) + Number(newRow.adjCommissions) + Number(newRow.ecommerceCommissions) + Number(newRow.other) + Number(newRow.retroPay) + Number(newRow.payInLieuQC) + Number(newRow.payInLieu) + Number(newRow.finalTerminationPay) + Number(newRow.statHoliday) + Number(newRow.subTotal) + Number(newRow.adjustments);
            
            newRow.weeklyGrossEarnings = gross;
            return newRow;
        });
        
        setPayrollData(homeStorePayroll);

        const currentStoreSchedule = allSchedules.find(s => s.storeId === selectedStore);
        if (currentStoreSchedule) {
            const guestAssociates = currentStoreSchedule.rows
                .filter(row => {
                    const emp = allEmployees.find(e => e.id === row.id);
                    return emp && emp.associatedStore !== selectedStore;
                })
                .map(row => {
                    const emp = allEmployees.find(e => e.id === row.id);
                    const hoursWorked = Object.values(row.actualHours || {}).reduce((sum, h) => sum + Number(h), 0);
                    const salesMade = allSales
                        .filter(s => s.storeId === selectedStore)
                        .reduce((sum, sale) => sum + (sale.items || [])
                            .filter(item => item.salesRep === emp.name)
                            .reduce((itemSum, item) => itemSum + (item.total || 0), 0), 0);
                    
                    const rate = emp.rate || 0;
                    const earnings = hoursWorked * rate;
                    const commission = salesMade * (parseFloat(emp.commissionPlan || '2') / 100);

                    return {
                        id: emp.id,
                        name: emp.name,
                        positionId: emp.positionId,
                        homeStore: emp.associatedStore,
                        hoursWorked,
                        sales: salesMade,
                        rate,
                        earnings,
                        commission,
                        totalWages: earnings + commission
                    };
                });
            setTransfersInData(guestAssociates);
        }

    }, [allEmployees, allSchedules, allSales, selectedStore, payroll]);

    const handlePayrollChange = (id, field, value) => {
        setPayrollData(currentData => currentData.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: value };
                
                const gross = (Number(newRow.rate) * (newRow.regularHours + newRow.adjHrs + newRow.vacationHours + newRow.personalHours + newRow.sickHours + newRow.statHolidayHours)) +
                              (Number(newRow.rate) * 1.5 * newRow.otHours) +
                              Number(newRow.base) + Number(newRow.commission) + Number(newRow.bonusPay) + Number(newRow.adjCommissions) + Number(newRow.ecommerceCommissions) + Number(newRow.other) + Number(newRow.retroPay) + Number(newRow.payInLieuQC) + Number(newRow.payInLieu) + Number(newRow.finalTerminationPay) + Number(newRow.statHoliday) + Number(newRow.subTotal) + Number(newRow.adjustments);
                newRow.weeklyGrossEarnings = gross;
                return newRow;
            }
            return row;
        }));
    };

    const executeSavePayroll = async () => {
        if (!db) return;
        setSaveState('saving');
        const payrollDocId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/payrolls`, payrollDocId);
        try {
            await setDoc(docRef, {
                rows: payrollData,
                storeId: selectedStore,
                week: currentWeek,
                year: currentYear
            }, { merge: true });
            setSaveState('saved');
            setNotification({message: t.payrollDataSavedSuccess, type: 'success'});
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving payroll data:", error);
            setNotification({message: t.errorSavingPayroll, type: 'error'});
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => setIsConfirmModalOpen(true);
    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSavePayroll();
    };
    
    const payrollColumns = [
        { header: 'Payroll Name', field: 'payrollName', readOnly: true },
        { header: 'Position ID', field: 'positionId', readOnly: true },
        { header: 'Job Title Description', field: 'jobTitleDescription', readOnly: true },
        { header: 'Work Locations', field: 'workLocations', readOnly: true },
        { header: 'Rate', field: 'rate', type: 'number' },
        { header: 'Base', field: 'base', type: 'number' },
        { header: 'Commission $$$', field: 'commission', type: 'number', readOnly: true },
        { header: 'Regular Hours', field: 'regularHours', type: 'number', readOnly: true },
        { header: 'OT Hrs', field: 'otHours', type: 'number', readOnly: true },
        { header: 'Sales Results', field: 'salesResults', type: 'number', readOnly: true },
        { header: 'Bonus Pay $$$', field: 'bonusPay', type: 'number' },
        { header: 'Sub-Total', field: 'subTotal', type: 'number' },
        { header: 'Adjustments $$$', field: 'adjustments', type: 'number' },
        { header: 'Weekly Gross Earnings', field: 'weeklyGrossEarnings', type: 'number', readOnly: true },
        { header: 'ADJ HRS', field: 'adjHrs', type: 'number' },
        { header: 'Stat Holiday Hours', field: 'statHolidayHours', type: 'number' },
        { header: 'Vacation Hours', field: 'vacationHours', type: 'number' },
        { header: 'Adj. Commissions $$$', field: 'adjCommissions', type: 'number' },
        { header: 'E-Commerce Commissions$$$', field: 'ecommerceCommissions', type: 'number' },
        { header: 'Other $$$', field: 'other', type: 'number' },
        { header: 'Retro Pay $$$', field: 'retroPay', type: 'number' },
        { header: 'Pay in Lieu QC $$$', field: 'payInLieuQC', type: 'number' },
        { header: 'Pay in Lieu $$$', field: 'payInLieu', type: 'number' },
        { header: 'Final Termination Pay $$$', field: 'finalTerminationPay', type: 'number' },
        { header: 'Comments', field: 'comments', type: 'text' },
        { header: 'Stat Holiday $$$', field: 'statHoliday', type: 'number' },
        { header: 'Personal Hours', field: 'personalHours', type: 'number' },
        { header: 'Sick Hours', field: 'sickHours', type: 'number' },
    ];
    
    const totals = useMemo(() => {
        const initialTotals = {};
        payrollColumns.forEach(col => {
            if (col.type === 'number') initialTotals[col.field] = 0;
        });
        payrollData.forEach(row => {
            payrollColumns.forEach(col => {
                if (col.type === 'number') initialTotals[col.field] += Number(row[col.field]) || 0;
            });
        });
        return initialTotals;
    }, [payrollData]);

    const totalWeeklySales = allSales
        .filter(s => s.storeId === selectedStore && s.type !== TRANSACTION_TYPES.GIFT_CARD)
        .reduce((sum, s) => sum + s.total, 0);

    const payrollPercentage = totalWeeklySales > 0 ? (totals.weeklyGrossEarnings / totalWeeklySales) * 100 : 0;
    const targetVsActual = totalWeeklySales - (performanceGoals.weeklySalesTarget || 0);

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{t.payroll}</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-400">{t.payrollPercentage}</p>
                            <p className="text-xl font-bold">{payrollPercentage.toFixed(2)}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">{t.targetVsActual}</p>
                            <p className={`text-xl font-bold ${targetVsActual >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(targetVsActual)}</p>
                        </div>
                        <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.savePayroll} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400 border-collapse">
                        {/* Payroll Table Header */}
                        <tbody>
                            {/* Payroll Table Rows */}
                        </tbody>
                         <tfoot className="text-white font-bold bg-gray-700">
                            {/* Payroll Table Footer */}
                        </tfoot>
                    </table>
                </div>
            </div>
            {/* Transfers In Section */}
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
