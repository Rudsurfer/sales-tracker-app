import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { TRANSACTION_TYPES, SALE_CATEGORIES, DAYS_OF_WEEK } from '../constants';

export const Reports = ({ t, selectedStore, currentWeek, currentYear, API_BASE_URL }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });
    const [goals, setGoals] = useState({});

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [salesRes, scheduleRes, goalsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                fetch(`${API_BASE_URL}/goals/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
            ]);
            setSales(Array.isArray(salesRes) ? salesRes : []);
            setSchedule(scheduleRes.status === 'not_found' ? { rows: [] } : scheduleRes);
            setGoals(goalsRes.status === 'not_found' ? {} : goalsRes);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const reportData = useMemo(() => {
        const dailyData = {};
        for(const dayName of DAYS_OF_WEEK) {
            dailyData[dayName] = {
                sales: 0,
                transactions: 0,
                units: 0,
                hours: 0,
                categoryUnits: Object.fromEntries(SALE_CATEGORIES.map(c => [c, 0]))
            };
        }

        sales.forEach(sale => {
            if (sale.Type_ === TRANSACTION_TYPES.GIFT_CARD || sale.Type_ === TRANSACTION_TYPES.RETURN) return;
            const day = sale.NameDay;
            if(dailyData[day]) {
                dailyData[day].sales += sale.TotalAmount;
                dailyData[day].transactions += 1;
                (sale.items || []).forEach(item => {
                    dailyData[day].units += item.Quantity;
                    if(dailyData[day].categoryUnits[item.Category] !== undefined) {
                         dailyData[day].categoryUnits[item.Category] += item.Quantity;
                    }
                });
            }
        });

        schedule.rows?.forEach(row => {
             Object.entries(row.actualHours || {}).forEach(([day, hours]) => {
                if(dailyData[day]) {
                    dailyData[day].hours += Number(hours) || 0;
                }
            });
        });
        
        return dailyData;
    }, [sales, schedule]);

    const dailyAnalysis = useMemo(() => {
        const dailyGoals = JSON.parse(goals.DailyGoals || '{}');

        return Object.entries(reportData).map(([day, data]) => {
            const dayKey = day.toLowerCase();
            const target = dailyGoals[dayKey] || 0;
            return {
                day: t[dayKey] || day,
                target,
                totalSales: data.sales,
                differential: data.sales - target,
                percentOfObjective: target > 0 ? (data.sales / target) * 100 : 0,
                numTransactions: data.transactions,
                unitsSold: data.units,
                hoursWorked: data.hours,
                dollarsPerHour: data.hours > 0 ? data.sales / data.hours : 0,
                dollarsPerTransaction: data.transactions > 0 ? data.sales / data.transactions : 0,
                unitsPerTransaction: data.transactions > 0 ? data.units / data.transactions : 0,
                categoryUnits: data.categoryUnits
            };
        });
    }, [reportData, goals, t]);

     const analysisTotals = useMemo(() => {
        return dailyAnalysis.reduce((acc, curr) => {
            acc.target += curr.target;
            acc.totalSales += curr.totalSales;
            acc.numTransactions += curr.numTransactions;
            acc.unitsSold += curr.unitsSold;
            acc.hoursWorked += curr.hoursWorked;
            SALE_CATEGORIES.forEach(cat => {
                acc.categoryUnits[cat] += curr.categoryUnits[cat];
            });
            return acc;
        }, { target: 0, totalSales: 0, numTransactions: 0, unitsSold: 0, hoursWorked: 0, categoryUnits: Object.fromEntries(SALE_CATEGORIES.map(c => [c, 0]))});
    }, [dailyAnalysis]);

    analysisTotals.differential = analysisTotals.totalSales - analysisTotals.target;
    analysisTotals.percentOfObjective = analysisTotals.target > 0 ? (analysisTotals.totalSales / analysisTotals.target) * 100 : 0;
    analysisTotals.dollarsPerHour = analysisTotals.hoursWorked > 0 ? analysisTotals.totalSales / analysisTotals.hoursWorked : 0;
    analysisTotals.dollarsPerTransaction = analysisTotals.numTransactions > 0 ? analysisTotals.totalSales / analysisTotals.numTransactions : 0;
    analysisTotals.unitsPerTransaction = analysisTotals.numTransactions > 0 ? analysisTotals.unitsSold / analysisTotals.numTransactions : 0;


    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-white">{t.weeklyReport}</h2>
                 <button onClick={fetchData} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"><RefreshCw size={18} className="mr-2" /> {t.refreshData}</button>
            </div>
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-white">{t.performanceSummary}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400 whitespace-nowrap">
                         <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                             <tr>
                                <th className="px-2 py-3">{t.day}</th>
                                <th className="px-2 py-3 text-right">{t.objective}</th>
                                <th className="px-2 py-3 text-right">{t.totalSales}</th>
                                <th className="px-2 py-3 text-right">{t.differential}</th>
                                <th className="px-2 py-3 text-right">{t.percentObjective}</th>
                                <th className="px-2 py-3 text-right">{t.numTransactions}</th>
                                <th className="px-2 py-3 text-right">{t.unitsSold}</th>
                                <th className="px-2 py-3 text-right">{t.hoursWorked}</th>
                                <th className="px-2 py-3 text-right">{t.dph}</th>
                                <th className="px-2 py-3 text-right">{t.dpt}</th>
                                <th className="px-2 py-3 text-right">{t.upt}</th>
                                {SALE_CATEGORIES.map(cat => <th key={cat} className="px-2 py-3 text-right">{t[cat] || cat}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {dailyAnalysis.map(row => (
                                <tr key={row.day} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-2 py-3 font-medium text-white">{row.day}</td>
                                    <td className="px-2 py-3 text-right">{formatCurrency(row.target)}</td>
                                    <td className="px-2 py-3 text-right">{formatCurrency(row.totalSales)}</td>
                                    <td className={`px-2 py-3 text-right ${row.differential < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(row.differential)}</td>
                                    <td className="px-2 py-3 text-right">{row.percentOfObjective.toFixed(2)}%</td>
                                    <td className="px-2 py-3 text-right">{row.numTransactions.toFixed(0)}</td>
                                    <td className="px-2 py-3 text-right">{row.unitsSold.toFixed(0)}</td>
                                    <td className="px-2 py-3 text-right">{row.hoursWorked.toFixed(2)}</td>
                                    <td className="px-2 py-3 text-right">{formatCurrency(row.dollarsPerHour)}</td>
                                    <td className="px-2 py-3 text-right">{formatCurrency(row.dollarsPerTransaction)}</td>
                                    <td className="px-2 py-3 text-right">{row.unitsPerTransaction.toFixed(2)}</td>
                                    {SALE_CATEGORIES.map(cat => <td key={cat} className="px-2 py-3 text-right">{row.categoryUnits[cat].toFixed(0)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="text-white font-bold bg-gray-700">
                             <tr>
                                <td className="px-2 py-3">{t.totals}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.target)}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.totalSales)}</td>
                                <td className={`px-2 py-3 text-right ${analysisTotals.differential < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(analysisTotals.differential)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.percentOfObjective.toFixed(2)}%</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.numTransactions.toFixed(0)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.unitsSold.toFixed(0)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.hoursWorked.toFixed(2)}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.dollarsPerHour)}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.dollarsPerTransaction)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.unitsPerTransaction.toFixed(2)}</td>
                                {SALE_CATEGORIES.map(cat => <td key={cat} className="px-2 py-3 text-right">{analysisTotals.categoryUnits[cat].toFixed(0)}</td>)}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};
