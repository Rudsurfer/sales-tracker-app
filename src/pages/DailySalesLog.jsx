import React, { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { DAYS_OF_WEEK, SALE_CATEGORIES, TRANSACTION_TYPES, PAYMENT_METHODS } from '../constants';
import { formatCurrency } from '../utils/helpers';

export const DailySalesLog = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, allEmployees }) => {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[new Date().getDay()]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/sales/${selectedStore}/${currentWeek}/${currentYear}`);
            const data = await response.json();
            setSales(data);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [selectedStore, currentWeek, currentYear]);

    const handleAddSale = async (newSale) => {
        try {
            await fetch(`${API_BASE_URL}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSale)
            });
            setNotification({ message: 'Sale added successfully!', type: 'success' });
            fetchSales(); // Refresh sales data
        } catch (error) {
            console.error("Error adding sale:", error);
            setNotification({ message: 'Error adding sale.', type: 'error' });
        }
    };

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
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                    <PlusCircle size={18} className="mr-2"/> Add Sale
                </button>
            </div>
            {isLoading ? (
                 <div className="text-center p-8">Loading...</div>
            ) : salesForSelectedDay.length === 0 ? (
                <div className="text-center p-8 bg-gray-800 rounded-lg">{t.noSalesForDay.replace('{day}', selectedDay)}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {salesForSelectedDay.map(sale => (
                        <div key={sale.SaleID} className="bg-gray-800 p-4 rounded-lg shadow">
                           {/* Display Sale Info Here */}
                           <p>{sale.OrderNo}</p>
                           <p>{formatCurrency(sale.TotalAmount)}</p>
                        </div>
                    ))}
                </div>
            )}
            {isAddModalOpen && <AddSaleModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddSale} {...{t, allEmployees, selectedStore, currentWeek, currentYear, selectedDay}} />}
        </div>
    );
};

// AddSaleModal component would go here, it needs to be created or refactored as well.
// For now, let's assume a placeholder. A full implementation would be needed.

const AddSaleModal = ({ onClose, onSave, t, allEmployees, selectedStore, currentWeek, currentYear, selectedDay }) => {
    // This is a placeholder and would need a full implementation
    return (
         <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Add New Sale</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div>Placeholder for Add Sale Form</div>
                 <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.done}</button>
                </div>
            </div>
        </div>
    )
}
