import React, { useState, useEffect, useMemo } from 'react';
import { DAYS_OF_WEEK } from '../constants';
import { formatCurrency } from '../utils/helpers';

export const DailySalesLog = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, t }) => {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[new Date().getDay()]);
    
    useEffect(() => {
        const fetchSales = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`);
                if (response.ok) {
                    const data = await response.json();
                    setSales(data);
                } else {
                    setSales([]);
                }
            } catch (error) {
                console.error("Error fetching sales:", error);
                setSales([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSales();
    }, [selectedStore, currentWeek, currentYear]);

    const salesForSelectedDay = sales.filter(s => s.NameDay === selectedDay);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                    {DAYS_OF_WEEK.map(day => (
                        <button key={day} onClick={() => setSelectedDay(day)} className={`px-4 py-2 rounded-md text-sm font-bold ${selectedDay === day ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                            {day}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">{t.invoiceNum}</th>
                                <th className="px-4 py-3">{t.salesRep}</th>
                                <th className="px-4 py-3">{t.items}</th>
                                <th className="px-4 py-3 text-right">{t.total}</th>
                                <th className="px-4 py-3">{t.payment}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesForSelectedDay.map(sale => (
                                <tr key={sale.SaleID} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-4 py-2 font-medium">{sale.OrderNo}</td>
                                    <td className="px-4 py-2">{(sale.items || []).map(i => i.SalesRep).join(', ')}</td>
                                    <td className="px-4 py-2">{(sale.items || []).length}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(sale.TotalAmount)}</td>
                                    <td className="px-4 py-2">{sale.PaymentMethod}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
