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
          if (week <= 0) { year--; week = 52 + week; }
          historyPromises.push(
            fetch(`${API_BASE_URL}/sales/${selectedStore}/${week}/${year}`).then(res => res.json()),
            fetch(`${API_BASE_URL}/schedule/${selectedStore}/${week}/${year}`).then(res => res.json()),
            fetch(`${API_BASE_URL}/stc/${selectedStore}/${week}/${year}`).then(res => res.json()),
            fetch(`${API_BASE_URL}/goals/${selectedStore}/${week}/${year}`).then(res => res.json())
          );
        }

        const historyResults = await Promise.all(historyPromises);
        const formattedHistory = [];
        for (let i = 0; i < historyResults.length; i += 4) {
          formattedHistory.push({
            week: currentWeek - (i / 4),
            sales: Array.isArray(historyResults[i]) ? historyResults[i] : [],
            schedule: historyResults[i + 1].status === 'not_found' ? { rows: [] } : historyResults[i + 1],
            stc: historyResults[i + 2].status === 'not_found' ? { HourlyData: {} } : historyResults[i + 2],
            goals: historyResults[i + 3].status === 'not_found' ? {} : historyResults[i + 3]
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

  const trendData = useMemo(() => {
    return historicalData.map(weeklyData => {
      const { sales, schedule, stc, goals } = weeklyData;
      const merchandiseSales = (sales || []).filter(s => s.Type_ !== TRANSACTION_TYPES.GIFT_CARD && s.Type_ !== TRANSACTION_TYPES.RETURN);
      const netSales = (sales || []).filter(s => s.Type_ !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.TotalAmount, 0);
      const totalTransactions = merchandiseSales.length;
      const totalUnits = merchandiseSales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.Quantity || 0), 0), 0);
      const totalTraffic = Object.values(stc.HourlyData || {}).reduce((daySum, dayData) =>
        daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.traffic || 0), 0), 0);
      const totalSTCTransactions = Object.values(stc.HourlyData || {}).reduce((daySum, dayData) =>
        daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.transactions || 0), 0), 0);

      const homeStoreEmployees = allEmployees.filter(e => e.StoreID === selectedStore);
      const getHourlyRate = emp => (emp.BaseSalary > 0 ? (emp.BaseSalary / 52) / 40 : emp.Rate);

      // Scheduled & Actual hours
      let totalScheduledHours = 0, scheduledLaborCost = 0;
      (schedule.rows || []).forEach(row => {
        let rowScheduledHours = 0;
        DAYS_OF_WEEK.forEach(day => {
          rowScheduledHours += parseShift(row.shifts?.[day.toLowerCase()] || '') || 0;
        });
        totalScheduledHours += rowScheduledHours;
        const emp = homeStoreEmployees.find(e => e.EmployeeID === row.EmployeeID);
        if (emp) scheduledLaborCost += rowScheduledHours * getHourlyRate(emp);
      });

      let totalActualHours = 0, actualLaborCost = 0;
      (schedule.rows || []).forEach(row => {
        const hours = Object.values(row.actualHours || {}).reduce((s, v) => s + (Number(v) || 0), 0);
        totalActualHours += hours;
        const emp = homeStoreEmployees.find(e => e.EmployeeID === row.EmployeeID);
        if (emp) actualLaborCost += hours * getHourlyRate(emp);
      });

      const weeklyGoal = Number(goals?.WeeklySalesTarget) || 0;
      const plannedWage = weeklyGoal > 0 ? ((scheduledLaborCost + (0.02 * weeklyGoal)) / weeklyGoal) * 100 : 0;
      const actualWage = netSales > 0 ? ((actualLaborCost + (0.02 * netSales)) / netSales) * 100 : 0;

      return {
        name: `W${weeklyData.week}`,
        netSales,
        conversionRate: totalTraffic > 0 ? (totalSTCTransactions / totalTraffic) * 100 : 0,
        avgTransactionValue: totalTransactions > 0 ? netSales / totalTransactions : 0,
        unitsPerTransaction: totalTransactions > 0 ? totalUnits / totalTransactions : 0,
        plannedWage,
        actualWage
      };
    });
  }, [historicalData, allEmployees, selectedStore]);

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
        <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyTrendAnalysis}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <TrendChart data={trendData} dataKey="netSales" title={t.netSales} color="#8884d8" formatter={formatCurrency} />
          <TrendChart data={trendData} dataKey="conversionRate" title={t.conversionRate} color="#82ca9d" formatter={(v) => `${v.toFixed(2)}%`} />
          <TrendChart data={trendData} dataKey="avgTransactionValue" title={t.dpt} color="#ff8042" formatter={formatCurrency} />
          <TrendChart data={trendData} dataKey="unitsPerTransaction" title={t.upt} color="#ffc658" formatter={(v) => v.toFixed(2)} />
        </div>
      </div>

      {/* New Wage Cost Percentage Trends */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Wage Cost Percentage Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="name" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" tickFormatter={(v) => `${v.toFixed(1)}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#2D3748', border: 'none', color: '#E2E8F0', borderRadius: '0.5rem' }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
            />
            <Legend />
            <Line type="monotone" dataKey="plannedWage" name="Planned Wage %" stroke="#60A5FA" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="actualWage" name="Actual Wage %" stroke="#F87171" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
