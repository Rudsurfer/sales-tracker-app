import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { TRANSACTION_TYPES, SALE_CATEGORIES, COLORS } from '../constants';

const ReportStatCard = ({ title, value }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const TrendChart = ({ data, dataKey, title, color, formatter }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" tickFormatter={formatter} domain={['dataMin', 'dataMax']} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#2D3748', border: 'none', color: '#E2E8F0', borderRadius: '0.5rem' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value) => [formatter(value), title]}
                />
                <Legend />
                <Line type="monotone" dataKey={dataKey} name={title} stroke={color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const Reports = ({ selectedStore, currentYear, currentWeek, t, API_BASE_URL }) => {
    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });
    const [historicalData, setHistoricalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [salesRes, scheduleRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`),
                    fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`)
                ]);
                setSales(await salesRes.json());
                setSchedule(await scheduleRes.json());

                // Fetch historical data for trends
                const historyPromises = [];
                for (let i = 0; i < 8; i++) {
                    let week = currentWeek - i;
                    let year = currentYear;
                    if (week <= 0) { year--; week = 52 + week; }
                    historyPromises.push(
                        fetch(`${API_BASE_URL}/sales/${selectedStore}/${week}/${year}`).then(res => res.json()),
                        fetch(`${API_BASE_URL}/schedule/${selectedStore}/${week}/${year}`).then(res => res.json()),
                        fetch(`${API_BASE_URL}/stc/${selectedStore}/${week}/${year}`).then(res => res.json())
                    );
                }
                const historyResults = await Promise.all(historyPromises);
                const formattedHistory = [];
                for (let i = 0; i < historyResults.length; i += 3) {
                    formattedHistory.push({
                        week: currentWeek - (i/3),
                        sales: historyResults[i],
                        schedule: historyResults[i+1],
                        stc: historyResults[i+2]
                    });
                }
                setHistoricalData(formattedHistory.reverse());

            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    // ... (All useMemo calculations remain the same, but will now use the state variables: sales, schedule, historicalData)

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-8">
            {/* ... (JSX for the report page remains the same) ... */}
        </div>
    );
};
