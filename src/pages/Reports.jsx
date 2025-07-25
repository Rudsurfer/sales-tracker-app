import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell } from 'recharts';
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
                <YAxis stroke="#A0AEC0" tickFormatter={formatter} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#2D3748', border: 'none', color: '#E2E8F0', borderRadius: '0.5rem' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value) => [formatter(value), title]}
                />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export const Reports = ({ sales, schedule, db, appId, selectedStore, currentYear, currentWeek, t }) => {
    const [historicalData, setHistoricalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistoricalData = async () => {
            if (!db || !selectedStore) return;
            setIsLoading(true);
            const data = [];
            const weeksToFetch = 8;
            const basePath = `artifacts/${appId}/public/data`;

            for (let i = 0; i < weeksToFetch; i++) {
                const week = currentWeek - i;
                const year = week <= 0 ? currentYear - 1 : currentYear;
                const adjustedWeek = week <= 0 ? 52 + week : week;

                const salesQuery = query(collection(db, `${basePath}/sales`), where("storeId", "==", selectedStore), where("week", "==", adjustedWeek), where("year", "==", year));
                const scheduleDocRef = doc(db, `${basePath}/schedules`, `${selectedStore}-${year}-W${adjustedWeek}`);
                const stcDocRef = doc(db, `${basePath}/stc`, `${selectedStore}-${year}-W${adjustedWeek}`);

                const [salesSnapshot, scheduleDoc, stcDoc] = await Promise.all([
                    getDocs(salesQuery),
                    getDoc(scheduleDocRef),
                    getDoc(stcDocRef)
                ]);

                const weeklySales = salesSnapshot.docs.map(d => d.data());
                const weeklySchedule = scheduleDoc.exists() ? scheduleDoc.data() : { rows: [] };
                const weeklyStc = stcDoc.exists() ? stcDoc.data() : { days: {} };

                data.push({ week: adjustedWeek, year, sales: weeklySales, schedule: weeklySchedule, stc: weeklyStc });
            }

            setHistoricalData(data.reverse());
            setIsLoading(false);
        };

        fetchHistoricalData();
    }, [db, selectedStore, currentWeek, currentYear, appId]);

    const trendData = useMemo(() => {
        return historicalData.map(weeklyData => {
            const { sales, schedule, stc } = weeklyData;
            
            const merchandiseSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD && s.type !== TRANSACTION_TYPES.RETURN);
            const netSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.total, 0);
            const totalTransactions = merchandiseSales.length;
            const totalUnits = merchandiseSales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);
            
            const totalTraffic = Object.values(stc.days || {}).reduce((daySum, dayData) => daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.traffic || 0), 0), 0);
            const totalSTCTransactions = Object.values(stc.days || {}).reduce((daySum, dayData) => daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.transactions || 0), 0), 0);
            const totalHours = (schedule.rows || []).reduce((sum, row) => sum + Object.values(row.actualHours || {}).reduce((hSum, h) => hSum + Number(h), 0), 0);

            return {
                name: `W${weeklyData.week}`,
                netSales,
                conversionRate: totalTraffic > 0 ? (totalSTCTransactions / totalTraffic) * 100 : 0,
                dollarsPerHour: totalHours > 0 ? netSales / totalHours : 0,
                avgTransactionValue: totalTransactions > 0 ? netSales / totalTransactions : 0,
                unitsPerTransaction: totalTransactions > 0 ? totalUnits / totalTransactions : 0,
            };
        });
    }, [historicalData]);

    const { totalSales, totalReturns, avgTransactionValue, unitsPerTransaction, giftCardSales, categorySalesData } = useMemo(() => {
        const merchandiseSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD && s.type !== TRANSACTION_TYPES.RETURN);
        const returns = sales.filter(s => s.type === TRANSACTION_TYPES.RETURN);
        const giftCardSalesData = sales.filter(s => s.type === TRANSACTION_TYPES.GIFT_CARD);

        const totalTransactions = merchandiseSales.length;
        const grossSales = merchandiseSales.reduce((sum, s) => sum + s.total, 0);
        const totalReturnValue = returns.reduce((sum, s) => sum + s.total, 0);
        const netSales = grossSales + totalReturnValue;

        const totalQuantity = merchandiseSales.reduce((sum, sale) => {
            return sum + (sale.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0);
        }, 0);
        
        const categoryTotals = {};
        sales.forEach(sale => {
            if (sale.type !== TRANSACTION_TYPES.RETURN) {
                (sale.items || []).forEach(item => {
                    const itemValue = item.total || (item.price * item.quantity);
                    if (!categoryTotals[item.category]) categoryTotals[item.category] = 0;
                    categoryTotals[item.category] += itemValue;
                });
            }
        });

        return {
            totalSales: netSales,
            totalReturns: totalReturnValue,
            avgTransactionValue: totalTransactions > 0 ? netSales / totalTransactions : 0,
            unitsPerTransaction: totalTransactions > 0 ? totalQuantity / totalTransactions : 0,
            giftCardSales: giftCardSalesData.reduce((sum, s) => sum + s.total, 0),
            categorySalesData: Object.entries(categoryTotals).map(([name, value]) => ({ name, value })).filter(d => d.value > 0)
        };
    }, [sales]);

    const weeklySellersAnalysis = useMemo(() => {
        if (!schedule?.rows) return [];
        const employeeAnalysis = new Map();

        schedule.rows.filter(row => row.name).forEach(row => {
            employeeAnalysis.set(row.name, {
                name: row.name,
                objective: row.objective || 0,
                totalSales: 0,
                numTransactions: 0,
                unitsSold: 0,
                hoursWorked: Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0),
                categoryUnits: SALE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {})
            });
        });

        const transactionSellers = new Map();

        sales.forEach(sale => {
            if (sale.type === TRANSACTION_TYPES.GIFT_CARD) return;
            
            (sale.items || []).forEach(item => {
                const rep = item.salesRep;
                 const itemValue = item.total || (item.price * item.quantity);

                if (employeeAnalysis.has(rep)) {
                    const emp = employeeAnalysis.get(rep);
                    emp.totalSales += itemValue;
                    
                    if (sale.type !== TRANSACTION_TYPES.RETURN) {
                        emp.unitsSold += item.quantity;
                        emp.categoryUnits[item.category] += item.quantity;
                        
                        if (!transactionSellers.has(sale.id)) {
                            transactionSellers.set(sale.id, new Set());
                        }
                        transactionSellers.get(sale.id).add(rep);
                    }
                }
            });
        });
        
        transactionSellers.forEach((reps) => {
            reps.forEach(repName => {
                if (employeeAnalysis.has(repName)) {
                    employeeAnalysis.get(repName).numTransactions += 1;
                }
            });
        });


        return Array.from(employeeAnalysis.values()).map(emp => ({
            ...emp,
            differential: emp.totalSales - emp.objective,
            percentOfObjective: emp.objective > 0 ? (emp.totalSales / emp.objective) * 100 : 0,
            dollarsPerHour: emp.hoursWorked > 0 ? emp.totalSales / emp.hoursWorked : 0,
            dollarsPerTransaction: emp.numTransactions > 0 ? emp.totalSales / emp.numTransactions : 0,
            unitsPerTransaction: emp.numTransactions > 0 ? emp.unitsSold / emp.numTransactions : 0,
        }));

    }, [sales, schedule]);

    const analysisTotals = useMemo(() => {
        const totals = {
            objective: 0,
            totalSales: 0,
            differential: 0,
            numTransactions: 0,
            unitsSold: 0,
            hoursWorked: 0,
            categoryUnits: {}
        };
        SALE_CATEGORIES.forEach(cat => totals.categoryUnits[cat] = 0);

        weeklySellersAnalysis.forEach(seller => {
            totals.objective += seller.objective;
            totals.totalSales += seller.totalSales;
            totals.numTransactions += seller.numTransactions;
            totals.unitsSold += seller.unitsSold;
            totals.hoursWorked += seller.hoursWorked;
            SALE_CATEGORIES.forEach(cat => {
                totals.categoryUnits[cat] += seller.categoryUnits[cat];
            });
        });

        totals.differential = totals.totalSales - totals.objective;
        totals.percentOfObjective = totals.objective > 0 ? (totals.totalSales / totals.objective) * 100 : 0;
        totals.dollarsPerHour = totals.hoursWorked > 0 ? totals.totalSales / totals.hoursWorked : 0;
        totals.dollarsPerTransaction = totals.numTransactions > 0 ? totals.totalSales / totals.numTransactions : 0;
        totals.unitsPerTransaction = totals.numTransactions > 0 ? totals.unitsSold / totals.numTransactions : 0;

        return totals;
    }, [weeklySellersAnalysis]);

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                 <h2 className="text-xl font-bold mb-4 text-white">{t.currentWeekPerformance}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <ReportStatCard title={t.netSales} value={formatCurrency(totalSales)} />
                    <ReportStatCard title={t.totalReturns} value={formatCurrency(totalReturns)} />
                    <ReportStatCard title={t.giftCardsSold} value={formatCurrency(giftCardSales)} />
                    <ReportStatCard title={t.avgDollarValue} value={formatCurrency(avgTransactionValue)} />
                    <ReportStatCard title={t.upt} value={unitsPerTransaction.toFixed(2)} />
                 </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.salesContributionByCategory}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={categorySalesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {categorySalesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyTrendAnalysis}</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="animate-spin text-blue-400" size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <TrendChart data={trendData} dataKey="netSales" title={t.netSales} color="#8884d8" formatter={formatCurrency} />
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
                                {SALE_CATEGORIES.map(cat => <th key={cat} className="px-2 py-3 text-right">{cat.slice(0,5)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {weeklySellersAnalysis.map(seller => (
                                <tr key={seller.name} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-2 py-2 font-medium">{seller.name}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.objective)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.totalSales)}</td>
                                    <td className={`px-2 py-2 text-right ${seller.differential < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(seller.differential)}</td>
                                    <td className="px-2 py-2 text-right">{seller.percentOfObjective.toFixed(2)}%</td>
                                    <td className="px-2 py-2 text-right">{seller.numTransactions.toFixed(0)}</td>
                                    <td className="px-2 py-2 text-right">{seller.unitsSold.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{seller.hoursWorked.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.dollarsPerHour)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.dollarsPerTransaction)}</td>
                                    <td className="px-2 py-2 text-right">{seller.unitsPerTransaction.toFixed(2)}</td>
                                    {SALE_CATEGORIES.map(cat => <td key={cat} className="px-2 py-2 text-right">{seller.categoryUnits[cat].toFixed(2)}</td>)}
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
