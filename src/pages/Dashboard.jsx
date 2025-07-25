import React, { useMemo } from 'react';
import { Award, Percent, DollarSign, Hash } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { DAYS_OF_WEEK, TRANSACTION_TYPES, COLORS } from '../constants';

const GoalProgressCard = ({ title, actual, target, percent }) => {
    const progress = Math.min(percent, 100);
    const strokeColor = progress >= 100 ? '#48BB78' : (progress > 50 ? '#4299E1' : '#F56565');
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">{title}</h3>
            <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-700" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                        className="transition-all duration-500"
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeDasharray={`${progress}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{percent.toFixed(0)}%</span>
                </div>
            </div>
            <div className="text-center mt-4">
                <p className="text-2xl font-bold text-white">{formatCurrency(actual)}</p>
                <p className="text-sm text-gray-400">/ {formatCurrency(target)}</p>
            </div>
        </div>
    );
};

const KPIStatCard = ({ title, value, icon: Icon, color }) => {
    const colors = {
        purple: 'text-purple-400',
        blue: 'text-blue-400',
        orange: 'text-orange-400',
    };
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-start justify-between">
                <p className="text-sm text-gray-400">{title}</p>
                <Icon size={20} className={colors[color]} />
            </div>
            <p className="text-4xl font-bold text-white mt-2">{value}</p>
        </div>
    );
};

export const Dashboard = ({ sales, performanceGoals, stcData, t, allSchedules, allSales, selectedStore, allEmployees }) => {
    const { netSales, avgTransactionValue, unitsPerTransaction, conversionRate, leaderboardData, categorySalesData, payrollPercentage } = useMemo(() => {
        let totalNetSales = 0;
        const employeeSalesMap = new Map();
        const categoryTotals = {};

        sales.forEach(sale => {
            if (sale.type === TRANSACTION_TYPES.GIFT_CARD) return;
            totalNetSales += sale.total;
            (sale.items || []).forEach(item => {
                const rep = item.salesRep;
                 const itemValue = item.total || (item.price * item.quantity);
                if(rep) {
                    employeeSalesMap.set(rep, (employeeSalesMap.get(rep) || 0) + itemValue);
                }
                if (sale.type !== TRANSACTION_TYPES.RETURN) {
                    if (!categoryTotals[item.category]) categoryTotals[item.category] = 0;
                    categoryTotals[item.category] += itemValue;
                }
            });
        });
        
        const merchandiseSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD && s.type !== TRANSACTION_TYPES.RETURN);
        const totalTransactions = merchandiseSales.length;
        const totalUnits = merchandiseSales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);
        
        const totalTraffic = Object.values(stcData.days || {}).reduce((daySum, dayData) => {
            return daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.traffic || 0), 0);
        }, 0);
        
        const totalSTCTransactions = Object.values(stcData.days || {}).reduce((daySum, dayData) => {
            return daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.transactions || 0), 0);
        }, 0);

        const leaderboard = Array.from(employeeSalesMap.entries())
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3);
            
        const categorySales = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0)
            .sort((a,b) => b.value - a.value);
            
        let totalPayrollCost = 0;
        const homeStoreEmployees = allEmployees.filter(e => e.associatedStore === selectedStore);

        homeStoreEmployees.forEach(emp => {
            let totalHours = 0;
            let totalSales = 0;

            allSchedules.forEach(sched => {
                const row = sched.rows.find(r => r.id === emp.id);
                if (row) {
                    totalHours += Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                }
            });
            
            allSales.forEach(sale => {
                (sale.items || []).forEach(item => {
                    if(item.salesRep === emp.name) {
                        totalSales += item.total || (item.price * item.quantity);
                    }
                });
            });

            const regularHours = Math.min(totalHours, 40);
            const otHours = Math.max(0, totalHours - 40);
            const commission = totalSales * (parseFloat(emp.commissionPlan || '2') / 100);
            const gross = (emp.rate * regularHours) + (emp.rate * 1.5 * otHours) + (emp.baseSalary / 52) + commission;
            totalPayrollCost += gross;
        });
        
        const calculatedPayrollPercentage = totalNetSales > 0 ? (totalPayrollCost / totalNetSales) * 100 : 0;

        return {
            netSales: totalNetSales,
            avgTransactionValue: totalTransactions > 0 ? totalNetSales / totalTransactions : 0,
            unitsPerTransaction: totalTransactions > 0 ? totalUnits / totalTransactions : 0,
            conversionRate: totalTraffic > 0 ? (totalSTCTransactions / totalTraffic) * 100 : 0,
            leaderboardData: leaderboard,
            categorySalesData: categorySales,
            payrollPercentage: calculatedPayrollPercentage
        };
    }, [sales, stcData, allSchedules, allSales, selectedStore, allEmployees]);
    
    const todayString = DAYS_OF_WEEK[new Date().getDay()];
    const dailyTarget = performanceGoals.daily?.[todayString.toLowerCase()] || 0;
    const dailyActual = sales.filter(s => s.day === todayString && s.type !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.total, 0);
    const dailyPercent = dailyTarget > 0 ? (dailyActual / dailyTarget) * 100 : 0;

    const weeklyTarget = performanceGoals.weeklySalesTarget || 0;
    const weeklyPercent = weeklyTarget > 0 ? (netSales / weeklyTarget) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <GoalProgressCard title={t.todaysGoal} actual={dailyActual} target={dailyTarget} percent={dailyPercent} />
                <GoalProgressCard title={t.weeklyGoal} actual={netSales} target={weeklyTarget} percent={weeklyPercent} />
                <KPIStatCard title={t.conversionRate} value={`${conversionRate.toFixed(2)}%`} icon={Percent} color="purple" />
                <KPIStatCard title={t.dollarsPerTransaction} value={formatCurrency(avgTransactionValue)} icon={DollarSign} color="blue" />
                <KPIStatCard title={t.unitsPerTransaction} value={unitsPerTransaction.toFixed(2)} icon={Hash} color="orange" />
                <KPIStatCard title={t.payrollPercentage} value={`${payrollPercentage.toFixed(2)}%`} icon={Percent} color="purple" />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                     <h3 className="text-lg font-semibold mb-4 text-gray-200">{t.topSellers}</h3>
                     <div className="space-y-4">
                         {leaderboardData.map((seller, index) => (
                             <div key={seller.name} className="flex items-center">
                                 <Award size={24} className={index === 0 ? 'text-yellow-400' : (index === 1 ? 'text-gray-400' : 'text-yellow-600')} />
                                 <div className="ml-4 flex-grow">
                                     <p className="font-bold text-white">{seller.name}</p>
                                     <p className="text-sm text-gray-400">{formatCurrency(seller.sales)}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-200">{t.salesByCategory}</h3>
                    <div className="space-y-3 pr-2 max-h-52 overflow-y-auto">
                        {categorySalesData.map((cat, index) => (
                            <div key={cat.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    <span className="text-gray-300">{t[cat.name] || cat.name}</span>
                                </div>
                                <span className="font-bold text-white">{formatCurrency(cat.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};