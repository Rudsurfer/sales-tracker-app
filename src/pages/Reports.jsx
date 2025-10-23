import React, { useState, useEffect, useMemo } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Line
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { formatCurrency, parseShift } from '../utils/helpers';
import { TRANSACTION_TYPES, SALE_CATEGORIES, COLORS, DAYS_OF_WEEK } from '../constants';

const ReportStatCard = ({ title, value }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const TrendChart = ({ data, dataKey, title, color, formatter, secondKey, secondColor, secondName }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" tickFormatter={formatter} domain={['dataMin', 'dataMax']} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#2D3748',
                        border: 'none',
                        color: '#E2E8F0',
                        borderRadius: '0.5rem'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name) => [formatter(value), name]}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey={dataKey}
                    name={title}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                />
                {secondKey && (
                    <Line
                        type="monotone"
                        dataKey={secondKey}
                        name={secondName}
                        stroke={secondColor}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                    />
                )}
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const Reports = ({ selectedStore, currentYear, currentWeek, t, API_BASE_URL, allEmployees }) => {
    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });
    const [historicalData, setHistoricalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [salesRes, scheduleRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json())
                ]);
                setSales(Array.isArray(salesRes) ? salesRes : []);
                setSchedule(scheduleRes.status === 'not_found' ? { rows: [] } : scheduleRes);

                const historyPromises = [];
                for (let i = 0; i < 8; i++) {
                    let week = currentWeek - i;
                    let year = currentYear;
                    if (week <= 0) {
                        year--;
                        week = 52 + week;
                    }
                    historyPromises.push(
                        fetch(`${API_BASE_URL}/sales/${selectedStore}/${week}/${year}`).then(res => res.json()),
                        fetch(`${API_BASE_URL}/schedule/${selectedStore}/${week}/${year}`).then(res => res.json())
                    );
                }
                const historyResults = await Promise.all(historyPromises);
                const formattedHistory = [];
                for (let i = 0; i < historyResults.length; i += 2) {
                    formattedHistory.push({
                        week: currentWeek - i / 2,
                        sales: Array.isArray(historyResults[i]) ? historyResults[i] : [],
                        schedule: historyResults[i + 1].status === 'not_found' ? { rows: [] } : historyResults[i + 1]
                    });
                }
                setHistoricalData(formattedHistory.reverse());
            } catch (error) {
                console.error('Error fetching report data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    // === Wage % calculation for each historical week ===
    const trendData = useMemo(() => {
        return historicalData.map(weeklyData => {
            const { sales, schedule } = weeklyData;
            const totalSales = (sales || [])
                .filter(s => s.Type_ !== TRANSACTION_TYPES.GIFT_CARD)
                .reduce((sum, s) => sum + (s.TotalAmount || 0), 0);

            const storeEmployees = allEmployees.filter(e => e.StoreID === selectedStore);
            const getHourlyRate = emp => {
                if (!emp) return 0;
                if (emp.BaseSalary > 0) return emp.BaseSalary / 52 / 40;
                return emp.Rate || 0;
            };

            let totalScheduledHours = 0,
                scheduledLaborCost = 0,
                totalActualHours = 0,
                actualLaborCost = 0;

            (schedule.rows || []).forEach(row => {
                const emp = storeEmployees.find(e => e.EmployeeID === row.EmployeeID);
                const rate = getHourlyRate(emp);

                DAYS_OF_WEEK.forEach(day => {
                    const shift = row.shifts?.[day.toLowerCase()] || '';
                    const hours = parseShift(shift) || 0;
                    totalScheduledHours += hours;
                    scheduledLaborCost += hours * rate;
                });

                const actualHrs = Object.values(row.actualHours || {}).reduce(
                    (sum, h) => sum + (Number(h) || 0),
                    0
                );
                totalActualHours += actualHrs;
                actualLaborCost += actualHrs * rate;
            });

            const plannedWagePct =
                totalSales > 0 ? ((scheduledLaborCost + 0.02 * totalSales) / totalSales) * 100 : 0;
            const actualWagePct =
                totalSales > 0 ? ((actualLaborCost + 0.02 * totalSales) / totalSales) * 100 : 0;

            return {
                name: `W${weeklyData.week}`,
                netSales: totalSales,
                plannedWagePct,
                actualWagePct
            };
        });
    }, [historicalData, allEmployees, selectedStore]);

    const currentWeekMetrics = useMemo(() => {
        const netSales = sales
            .filter(s => s.Type_ !== TRANSACTION_TYPES.GIFT_CARD)
            .reduce((sum, s) => sum + s.TotalAmount, 0);
        const totalReturns = sales
            .filter(s => s.Type_ === TRANSACTION_TYPES.RETURN)
            .reduce((sum, s) => sum + s.TotalAmount, 0);
        const giftCardSales = sales
            .filter(s => s.Type_ === TRANSACTION_TYPES.GIFT_CARD)
            .reduce((sum, s) => sum + s.TotalAmount, 0);

        const merchandiseSales = sales.filter(
            s => s.Type_ !== TRANSACTION_TYPES.GIFT_CARD && s.Type_ !== TRANSACTION_TYPES.RETURN
        );
        const totalTransactions = merchandiseSales.length;
        const totalQuantity = merchandiseSales.reduce(
            (sum, sale) =>
                sum +
                (sale.items || []).reduce(
                    (itemSum, item) => itemSum + (Number(item.Quantity) || 0),
                    0
                ),
            0
        );

        return {
            totalSales: netSales,
            totalReturns,
            giftCardSales,
            avgTransactionValue:
                totalTransactions > 0 ? netSales / totalTransactions : 0,
            unitsPerTransaction:
                totalTransactions > 0 ? totalQuantity / totalTransactions : 0
        };
    }, [sales]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">{t.currentWeekPerformance}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <ReportStatCard title={t.netSales} value={formatCurrency(currentWeekMetrics.totalSales)} />
                    <ReportStatCard title={t.totalReturns} value={formatCurrency(currentWeekMetrics.totalReturns)} />
                    <ReportStatCard title={t.giftCardsSold} value={formatCurrency(currentWeekMetrics.giftCardSales)} />
                    <ReportStatCard title={t.avgDollarValue} value={formatCurrency(currentWeekMetrics.avgTransactionValue)} />
                    <ReportStatCard title={t.upt} value={currentWeekMetrics.unitsPerTransaction.toFixed(2)} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.salesContributionByCategory}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[]}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                labelLine={false}
                                label={renderCustomizedLabel}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyTrendAnalysis}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <TrendChart data={trendData} dataKey="netSales" title={t.netSales} color="#8884d8" formatter={formatCurrency} />
                        <TrendChart data={trendData} dataKey="plannedWagePct" title="Wage Cost %" color="#ff7300" secondKey="actualWagePct" secondColor="#00C49F" secondName="Actual Wage %" formatter={(v) => `${v.toFixed(2)}%`} />
                    </div>
                </div>
            </div>
        </div>
    );
};
