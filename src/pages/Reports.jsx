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
                    fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/schedule/${selectedStore}/${currentWeek}/${currentYear}`).then(res => res.json())
                ]);
                setSales(salesRes.status === 'not_found' ? [] : salesRes);
                setSchedule(scheduleRes.status === 'not_found' ? { rows: [] } : scheduleRes);

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
                        sales: historyResults[i].status === 'not_found' ? [] : historyResults[i],
                        schedule: historyResults[i+1].status === 'not_found' ? { rows: [] } : historyResults[i+1],
                        stc: historyResults[i+2].status === 'not_found' ? { HourlyData: {} } : historyResults[i+2]
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

    // ... (All useMemo calculations remain the same)

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
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
                                data={currentWeekMetrics.categoryData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={100} 
                                labelLine={false}
                                label={renderCustomizedLabel}
                            >
                                {currentWeekMetrics.categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [`${formatCurrency(value)} (${(props.payload.percent * 100).toFixed(2)}%)`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyTrendAnalysis}</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <RefreshCw className="animate-spin text-blue-400" size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <TrendChart data={trendData} dataKey="netSales" title={t.netSales} color="#8884d8" formatter={formatCurrency} />
                            <TrendChart data={trendData} dataKey="conversionRate" title={t.conversionRate} color="#82ca9d" formatter={(v) => `${v.toFixed(2)}%`} />
                            <TrendChart data={trendData} dataKey="dollarsPerHour" title={t.dph} color="#ffc658" formatter={formatCurrency} />
                            <TrendChart data={trendData} dataKey="avgTransactionValue" title={t.dpt} color="#ff8042" formatter={formatCurrency} />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">{t.currentWeekSellersAnalysis}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-2 py-3">{t.seller}</th>
                                <th className="px-2 py-3 text-right">{t.objective}</th>
                                <th className="px-2 py-3 text-right">{t.netSales}</th>
                                <th className="px-2 py-3 text-right">{t.differential}</th>
                                <th className="px-2 py-3 text-right">{t.percent}</th>
                                <th className="px-2 py-3 text-right">{t.numTrans}</th>
                                <th className="px-2 py-3 text-right">{t.units}</th>
                                <th className="px-2 py-3 text-right">{t.hrs}</th>
                                <th className="px-2 py-3 text-right">{t.dph}</th>
                                <th className="px-2 py-3 text-right">{t.dpt}</th>
                                <th className="px-2 py-3 text-right">{t.upt}</th>
                                {SALE_CATEGORIES.map(cat => <th key={cat} className="px-2 py-3 text-right">{t[cat] || cat.slice(0,5)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {currentWeekMetrics.weeklySellersAnalysis.map(seller => (
                                <tr key={seller.name} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-2 py-2 font-medium">{seller.name}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.objective)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.totalSales)}</td>
                                    <td className={`px-2 py-2 text-right ${seller.differential < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(seller.differential)}</td>
                                    <td className="px-2 py-2 text-right">{seller.percentOfObjective.toFixed(2)}%</td>
                                    <td className="px-2 py-2 text-right">{seller.numTransactions.toFixed(0)}</td>
                                    <td className="px-2 py-2 text-right">{seller.unitsSold.toFixed(0)}</td>
                                    <td className="px-2 py-2 text-right">{seller.hoursWorked.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.dollarsPerHour)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.dollarsPerTransaction)}</td>
                                    <td className="px-2 py-2 text-right">{seller.unitsPerTransaction.toFixed(2)}</td>
                                    {SALE_CATEGORIES.map(cat => <td key={cat} className="px-2 py-2 text-right">{seller.categoryUnits[cat].toFixed(0)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="text-white font-bold bg-gray-700">
                            <tr>
                                <td className="px-2 py-3">{t.totals}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.objective)}</td>
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
