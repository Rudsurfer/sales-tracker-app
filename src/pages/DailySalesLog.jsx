import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X, Trash2, Edit } from 'lucide-react';
import { DAYS_OF_WEEK, SALE_CATEGORIES, TRANSACTION_TYPES, PAYMENT_METHODS } from '../constants';
import { formatCurrency } from '../utils/helpers';
import { SaveButton, ConfirmationModal } from '../components/ui';

const SaleEditModal = ({ sale, onClose, onSave, t, allEmployees, selectedStore }) => {
    const [editedSale, setEditedSale] = useState(sale);

    useEffect(() => {
        setEditedSale(sale);
    }, [sale]);

    const handleSaleChange = (field, value) => {
        setEditedSale(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...editedSale.items];
        newItems[index] = { ...newItems[index], [field]: value };
        // Recalculate subtotal
        if (field === 'Quantity' || field === 'Price') {
            const qty = parseFloat(newItems[index].Quantity) || 0;
            const price = parseFloat(newItems[index].Price) || 0;
            newItems[index].Subtotal = qty * price;
        }
        setEditedSale(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        const newItem = { SalesRep: '', Description_: '', Category: SALE_CATEGORIES[0], Quantity: 1, Price: 0, Subtotal: 0 };
        setEditedSale(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index) => {
        const newItems = editedSale.items.filter((_, i) => i !== index);
        setEditedSale(prev => ({ ...prev, items: newItems }));
    };
    
    const totalAmount = useMemo(() => {
        return editedSale.items.reduce((sum, item) => sum + (item.Subtotal || 0), 0);
    }, [editedSale.items]);

    const handleSave = () => {
        onSave({ ...editedSale, TotalAmount: totalAmount });
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">{editedSale.isNew ? t.addManualTransaction : t.editTransaction}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    {/* Main Sale Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <input type="text" placeholder={t.orderNumber} value={editedSale.OrderNo || ''} onChange={e => handleSaleChange('OrderNo', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-3 py-2" />
                         <select value={editedSale.Type_ || ''} onChange={e => handleSaleChange('Type_', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-3 py-2">
                            {TRANSACTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <select value={editedSale.PaymentMethod || ''} onChange={e => handleSaleChange('PaymentMethod', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-3 py-2">
                            {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                        </select>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                        {editedSale.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center bg-gray-700/50 p-2 rounded-md">
                                <select value={item.SalesRep} onChange={e => handleItemChange(index, 'SalesRep', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 md:col-span-2">
                                    <option value="">{t.selectSalesRep}</option>
                                    {allEmployees.filter(e => e.StoreID === selectedStore).map(emp => <option key={emp.EmployeeID} value={emp.Name}>{emp.Name}</option>)}
                                </select>
                                <select value={item.Category} onChange={e => handleItemChange(index, 'Category', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1">
                                    {SALE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <input type="number" placeholder={t.qty} value={item.Quantity} onChange={e => handleItemChange(index, 'Quantity', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1" />
                                <input type="number" placeholder={t.price} value={item.Price} onChange={e => handleItemChange(index, 'Price', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1" />
                                <div className="flex items-center justify-end">
                                    <span className="text-white mr-4">{formatCurrency(item.Subtotal)}</span>
                                    <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={addItem} className="flex items-center text-green-400 hover:text-green-300 mt-2"><PlusCircle size={16} className="mr-2"/>{t.addItem}</button>
                </div>
                
                 <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                    <span className="text-2xl font-bold text-white">{t.total}: {formatCurrency(totalAmount)}</span>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.saveTransaction}</button>
                </div>
            </div>
        </div>
    );
};


export const DailySalesLog = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, allEmployees }) => {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[new Date().getDay()]);
    const [editingSale, setEditingSale] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    
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

    useEffect(() => {
        fetchSales();
    }, [selectedStore, currentWeek, currentYear, API_BASE_URL]);

    const handleSaveSale = async (saleToSave) => {
        const isEditing = !saleToSave.isNew;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_BASE_URL}/sales/${saleToSave.SaleID}` : `${API_BASE_URL}/sales`;

        // Add context for new sales
        if (!isEditing) {
            saleToSave.StoreID = selectedStore;
            saleToSave.WeekNo = currentWeek;
            saleToSave.YearNo = currentYear;
            saleToSave.NameDay = selectedDay;
            // The backend will set the TransactionDate
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleToSave)
            });

            if (!response.ok) throw new Error('Failed to save sale');
            
            setNotification({ message: t.saleSavedSuccess, type: 'success' });
            setEditingSale(null);
            fetchSales(); // Refresh data
        } catch (error) {
            console.error("Error saving sale:", error);
            setNotification({ message: t.errorSavingSale, type: 'error' });
        }
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
                                        <button onClick={() => setEditingSale(sale)} className="text-blue-400 hover:text-blue-300" disabled={sale.OrderNo.startsWith('SHOPIFY-')}><Edit size={16} /></button>
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
            
            {editingSale && (
                <SaleEditModal 
                    sale={editingSale}
                    onClose={() => setEditingSale(null)}
                    onSave={handleSaveSale}
                    t={t}
                    allEmployees={allEmployees}
                    selectedStore={selectedStore}
                />
            )}

        </div>
    );
};
