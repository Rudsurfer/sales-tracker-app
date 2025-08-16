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
                const [scheduleRes, salesRes, goalsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/goals/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json())
                ]);

                const schedule = scheduleRes.status === 'not_found' ? { rows: [] } : scheduleRes;
                const sales = salesRes.status === 'not_found' ? [] : salesRes;
                
                const homeStoreEmployees = allEmployees.filter(e => e.StoreID === selectedStore);
                
                const calculatedPayroll = homeStoreEmployees.map(emp => {
                    let totalHours = 0;
                    let totalSales = 0;
                    const workLocations = new Set();
                    
                    const scheduleRow = schedule.rows?.find(r => r.EmployeeID === emp.EmployeeID);
                    if (scheduleRow) {
                        totalHours = Object.values(scheduleRow.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                        if(totalHours > 0) workLocations.add(selectedStore);
                    }

                    sales.forEach(sale => {
                         (sale.items || []).forEach(item => {
                            if (item.SalesRep === emp.Name) {
                                const itemValue = item.Subtotal;
                                totalSales += itemValue;
                            }
                        });
                    });
                    
                    const regularHours = Math.min(totalHours, 40);
                    const otHours = Math.max(0, totalHours - 40);
                    const commission = totalSales * (parseFloat(emp.CommissionPlan || '2') / 100);
                    const base = emp.BaseSalary > 0 ? emp.BaseSalary / 52 : 0;
                    const rate = emp.Rate || 0;
                    const gross = (rate * regularHours) + (rate * 1.5 * otHours) + base + commission;
                    
                    return {
                        id: emp.EmployeeID,
                        payrollName: emp.Name,
                        positionId: `FOLT000${emp.PositionID}`,
                        jobTitleDescription: emp.JobTitle,
                        workLocations: Array.from(workLocations).join(', '),
                        commissionPlan: emp.CommissionPlan || '2',
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
                });
                setPayrollData(calculatedPayroll);

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
        // ... (Export logic remains the same)
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-8">
            {/* ... (JSX for Payroll page) ... */}
        </div>
    );
};
