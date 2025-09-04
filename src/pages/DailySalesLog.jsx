import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X, Trash2, Edit } from 'lucide-react';
import { DAYS_OF_WEEK, SALE_CATEGORIES, TRANSACTION_TYPES, PAYMENT_METHODS } from '../constants';
import { formatCurrency } from '../utils/helpers';
import { SaveButton, ConfirmationModal } from '../components/ui';

export const DailySalesLog = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, allEmployees }) => {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[new Date().getDay()]);
    const [editingSale, setEditingSale] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    
    useEffect(() => {
        const fetchSales = async () => {
            if (!selectedStore || !currentWeek || !currentYear) return;
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
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const handleSaveSale = async (saleToSave) => {
        // ... (This logic remains for saving manual/edited sales)
    };

    const salesForDay = useMemo(() => {
        return sales.filter(s => s.NameDay === selectedDay);
    }, [sales, selectedDay]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{t.dailySalesLog}</h2>
                <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
                    {DAYS_OF_WEEK.map(day => (
                        <button key={day} onClick={() => setSelectedDay(day)} className={`px-4 py-2 text-sm font-bold rounded-md ${selectedDay === day ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                            {t[day.toLowerCase()]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-white">
                    {(t.salesFor || 'Sales for {day}').replace('{day}', t[selectedDay.toLowerCase()] || selectedDay)}
                </h3>
                 <div className="max-h-96 overflow-y-auto pr-2">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">{t.orderNumber}</th>
                                <th className="px-4 py-3">{t.type}</th>
                                <th className="px-4 py-3">{t.totalAmount}</th>
                                <th className="px-4 py-3">{t.paymentMethod}</th>
                                <th className="px-4 py-3">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesForDay.map(sale => (
                                <tr key={sale.SaleID} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-2">{sale.OrderNo}</td>
                                    <td className="px-4 py-2">{sale.Type_}</td>
                                    <td className="px-4 py-2">{formatCurrency(sale.TotalAmount)}</td>
                                    <td className="px-4 py-2">{sale.PaymentMethod}</td>
                                    <td className="px-4 py-2">
                                        <button onClick={() => setEditingSale(sale)} className="text-blue-400 hover:text-blue-300"><Edit size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                             {salesForDay.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">{t.noSalesForDay}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => setEditingSale({ isNew: true, items: [] })} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                    <PlusCircle size={18} className="mr-2"/> {t.addManualTransaction}
                </button>
            </div>
            
            {/* Modal for editing/adding sales would go here */}

        </div>
    );
};
