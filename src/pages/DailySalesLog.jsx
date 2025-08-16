import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X, Trash2 } from 'lucide-react';
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
                           <p className="font-bold">{sale.OrderNo}</p>
                           <p>{formatCurrency(sale.TotalAmount)}</p>
                           <p className="text-sm text-gray-400">{sale.Type_}</p>
                        </div>
                    ))}
                </div>
            )}
            {isAddModalOpen && <AddSaleModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddSale} {...{t, allEmployees, selectedStore, currentWeek, currentYear, selectedDay}} />}
        </div>
    );
};

const AddSaleModal = ({ onClose, onSave, t, allEmployees, selectedStore, currentWeek, currentYear, selectedDay }) => {
    const [sale, setSale] = useState({
        invoiceNum: '',
        type: TRANSACTION_TYPES.REGULAR,
        paymentMethod: PAYMENT_METHODS[0],
        notes: '',
        items: [{ salesRep: '', description: '', category: SALE_CATEGORIES[0], quantity: 1, price: 0, total: 0 }]
    });

    const handleSaleChange = (field, value) => setSale(s => ({ ...s, [field]: value }));
    const handleItemChange = (index, field, value) => {
        const newItems = [...sale.items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'price') {
            newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].price || 0);
        }
        setSale(s => ({ ...s, items: newItems }));
    };
    const addItem = () => setSale(s => ({ ...s, items: [...s.items, { salesRep: '', description: '', category: SALE_CATEGORIES[0], quantity: 1, price: 0, total: 0 }] }));
    const removeItem = (index) => setSale(s => ({ ...s, items: s.items.filter((_, i) => i !== index) }));
    
    const totalAmount = useMemo(() => sale.items.reduce((sum, item) => sum + item.total, 0), [sale.items]);

    const handleSave = () => {
        onSave({
            storeId: selectedStore,
            week: currentWeek,
            year: currentYear,
            day: selectedDay,
            ...sale,
            totalAmount
        });
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-4xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Add New Sale</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input type="text" placeholder={t.invoiceNum} value={sale.invoiceNum} onChange={e => handleSaleChange('invoiceNum', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-3 py-2" />
                    <select value={sale.type} onChange={e => handleSaleChange('type', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-3 py-2">
                        {Object.values(TRANSACTION_TYPES).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                     <select value={sale.paymentMethod} onChange={e => handleSaleChange('paymentMethod', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-3 py-2">
                        {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                </div>
                <div className="max-h-64 overflow-y-auto pr-2">
                    {sale.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-6 gap-2 mb-2 items-center">
                            <select value={item.salesRep} onChange={e => handleItemChange(index, 'salesRep', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 col-span-2">
                                <option value="">{t.soldBy}</option>
                                {allEmployees.map(e => <option key={e.EmployeeID} value={e.Name}>{e.Name}</option>)}
                            </select>
                            <select value={item.category} onChange={e => handleItemChange(index, 'category', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1">
                                {SALE_CATEGORIES.map(cat => <option key={cat} value={cat}>{t[cat] || cat}</option>)}
                            </select>
                            <input type="number" placeholder={t.qty} value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1" />
                            <input type="number" placeholder={t.price} value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1" />
                            <div className="flex items-center">
                                <span className="text-white mr-2">{formatCurrency(item.total)}</span>
                                <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addItem} className="flex items-center text-green-400 hover:text-green-300 mt-2"><PlusCircle size={16} className="mr-2"/>{t.addItem}</button>
                <div className="mt-4">
                    <textarea placeholder={t.notes} value={sale.notes} onChange={e => handleSaleChange('notes', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" rows="2"></textarea>
                </div>
                 <div className="flex justify-between items-center mt-6">
                    <span className="text-2xl font-bold text-white">{t.total}: {formatCurrency(totalAmount)}</span>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.saveTransaction}</button>
                </div>
            </div>
        </div>
    )
}