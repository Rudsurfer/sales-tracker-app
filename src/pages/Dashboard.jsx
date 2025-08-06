import React, { useState, useEffect, useMemo } from 'react';
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

const KPIStatCard = ({ title, value, icon: Icon, color, valueColorClass = 'text-white' }) => {
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
            <p className={`text-4xl font-bold mt-2 ${valueColorClass}`}>{value}</p>
        </div>
    );
};

export const Dashboard = ({ t, allEmployees, selectedStore, currentWeek, currentYear, API_BASE_URL }) => {
    const [sales, setSales] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [stcData, setStcData] = useState({ days: {} });
    const [performanceGoals, setPerformanceGoals] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [salesRes, schedulesRes, stcRes, goalsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`),
                    fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`),
                    fetch(`${API_BASE_URL}/stc/${selectedStore}/${currentWeek}/${currentYear}`),
                    fetch(`${API_BASE_URL}/goals/${selectedStore}/${currentWeek}/${currentYear}`)
                ]);
                setSales(await salesRes.json());
                setSchedules(await schedulesRes.json());
                setStcData(await stcRes.json());
                setPerformanceGoals(await goalsRes.json());
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const { netSales, avgTransactionValue, unitsPerTransaction, conversionRate, leaderboardData, categorySalesData, payrollPercentage, payrollPercentageColor } = useMemo(() => {
        // ... (calculations remain the same)
        return {
            // ... (return object remains the same)
        };
    }, [sales, stcData, schedules, allEmployees, selectedStore, t]);
    
    const todayString = DAYS_OF_WEEK[new Date().getDay()];
    const dailyTarget = performanceGoals.DailyGoals?.[todayString.toLowerCase()] || 0;
    const dailyActual = sales.filter(s => s.NameDay === todayString && s.Type_ !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.TotalAmount, 0);
    const dailyPercent = dailyTarget > 0 ? (dailyActual / dailyTarget) * 100 : 0;

    const weeklyTarget = performanceGoals.WeeklySalesTarget || 0;
    const weeklyPercent = weeklyTarget > 0 ? (netSales / weeklyTarget) * 100 : 0;

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ... (JSX remains the same) ... */}
        </div>
    );
};
