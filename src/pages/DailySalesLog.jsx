import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X, Trash2, ChevronDown, DollarSign, Hash } from 'lucide-react';
import { DAYS_OF_WEEK, SALE_CATEGORIES, TRANSACTION_TYPES, PAYMENT_METHODS } from '../constants';
import { formatCurrency } from '../utils/helpers';

export const DailySalesLog = ({ selectedStore, currentWeek, currentYear, API_BASE_URL, setNotification, t, allEmployees }) => {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(DAYS_OF_WEEK[new Date().getDay()]);
    const [editingSale, setEditingSale] = useState(null);
    
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

    useEffect(() => {
        fetchSales();
    }, [selectedStore, currentWeek, currentYear]);

    const handleSaveSale = async (saleToSave) => {
        const isEditing = !!saleToSave.SaleID;
        const url = isEditing ? `${API_BASE_URL}/sales/${saleToSave.SaleID}` : `${API_BASE_URL}/sales`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleToSave)
            });
            setNotification({ message: `Sale ${isEditing ? 'updated' : 'added'} successfully!`, type: 'success' });
            fetchSales(); // Refresh sales data
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} sale:`, error);
            setNotification({ message: `Error ${isEditing ? 'updating' : 'adding'} sale.`, type: 'error' });
        }
        setEditingSale(null);
    };

    const dailySummaries = useMemo(() => {
        return DAYS_OF_WEEK.map(day => {
            const daySales = sales.filter(s => s.NameDay === day);
            return {
                day,
                totalSales: daySales.reduce((sum, s) => sum + s.TotalAmount, 0),
                transactionCount: daySales.length
            };
        });
    }, [sales]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                 <button onClick={() => setEditingSale({})} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                    <PlusCircle size={18} className="mr-2"/> Add Sale
                </button>
            </div>
            {isLoading ? (
                <div className="text-center p-8 text-white">Loading Sales Data...</div>
            ) : (
                dailySummaries.map(summary => (
                    <div key={summary.day} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                        <button onClick={() => setActiveDay(activeDay === summary.day ? null : summary.day)} className="w-full p-4 flex justify-between items-center bg-gray-700/50 hover:bg-gray-700 transition-colors">
                            <span className="text-lg font-bold text-white">{summary.day}</span>
                            <div className="flex items-center gap-6 text-sm">
                                <span className="flex items-center text-green-400"><DollarSign size={16} className="mr-1"/> {formatCurrency(summary.totalSales)}</span>
                                <span className="flex items-center text-blue-400"><Hash size={16} className="mr-1"/> {summary.transactionCount} Transactions</span>
                                <ChevronDown size={20} className={`text-gray-400 transition-transform ${activeDay === summary.day ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        {activeDay === summary.day && (
                            <div className="p-4">
                                {summary.transactionCount > 0 ? (
                                    <table className="w-full text-sm text-left text-gray-300">
                                        <thead className="text-xs text-gray-400 uppercase">
                                            <tr>
                                                <th className="px-4 py-2">{t.invoiceNum}</th>
                                                <th className="px-4 py-2">{t.salesRep}</th>
                                                <th className="px-4 py-2">{t.items}</th>
                                                <th className="px-4 py-2 text-right">{t.total}</th>
                                                <th className="px-4 py-2">{t.payment}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.filter(s => s.NameDay === summary.day).map(sale => (
                                                <tr key={sale.SaleID} onClick={() => setEditingSale(sale)} className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer">
                                                    <td className="px-4 py-2 font-medium">{sale.OrderNo}</td>
                                                    <td className="px-4 py-2">{(sale.items || []).map(i => i.SalesRep).join(', ')}</td>
                                                    <td className="px-4 py-2">{(sale.items || []).length}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(sale.TotalAmount)}</td>
                                                    <td className="px-4 py-2">{sale.PaymentMethod}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center text-gray-400 py-4">{t.noSalesForDay.replace('{day}', summary.day)}</p>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
            {editingSale && <SaleModal onClose={() => setEditingSale(null)} onSave={handleSaveSale} {...{t, allEmployees, selectedStore, currentWeek, currentYear, selectedDay: activeDay, initialSale: editingSale}} />}
        </div>
    );
};

const SaleModal = ({ onClose, onSave, t, allEmployees, selectedStore, currentWeek, currentYear, selectedDay, initialSale }) => {
    const [sale, setSale] = useState(initialSale.SaleID ? initialSale : {
        OrderNo: '',
        Type_: TRANSACTION_TYPES.REGULAR,
        PaymentMethod: PAYMENT_METHODS[0],
        Notes: '',
        items: [{ SalesRep: '', Description_: '', Category: SALE_CATEGORIES[0], Quantity: 1, Price: 0, Subtotal: 0 }]
    });

    const handleSaleChange = (field, value) => setSale(s => ({ ...s, [field]: value }));
    const handleItemChange = (index, field, value) => {
        const newItems = [...sale.items];
        newItems[index][field] = value;
        if (field === 'Quantity' || field === 'Price') {
            newItems[index].Subtotal = (newItems[index].Quantity || 0) * (newItems[index].Price || 0);
        }
        setSale(s => ({ ...s, items: newItems }));
    };
    const addItem = () => setSale(s => ({ ...s, items: [...s.items, { SalesRep: '', Description_: '', Category: SALE_CATEGORIES[0], Quantity: 1, Price: 0, Subtotal: 0 }] }));
    const removeItem = (index) => setSale(s => ({ ...s, items: s.items.filter((_, i) => i !== index) }));
    
    const totalAmount = useMemo(() => sale.items.reduce((sum, item) => sum + item.Subtotal, 0), [sale.items]);

    const handleSave = () => {
        onSave({
            ...sale,
            StoreID: selectedStore,
            WeekNo: currentWeek,
            YearNo: currentYear,
            NameDay: selectedDay,
            TotalAmount: totalAmount
        });
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-4xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{initialSale.SaleID ? 'Edit Sale' : 'Add New Sale'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-xs text-gray-400">{t.invoiceNum}</label>
                        <input type="text" value={sale.OrderNo} onChange={e => handleSaleChange('OrderNo', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 mt-1" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">{t.type}</label>
                        <select value={sale.Type_} onChange={e => handleSaleChange('Type_', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 mt-1">
                            {Object.values(TRANSACTION_TYPES).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">{t.payment}</label>
                        <select value={sale.PaymentMethod} onChange={e => handleSaleChange('PaymentMethod', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 mt-1">
                            {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                        </select>
                    </div>
                </div>
                <div className="max-h-64 overflow-y-auto pr-2">
                    {sale.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-6 gap-2 mb-2 items-center">
                            <select value={item.SalesRep} onChange={e => handleItemChange(index, 'SalesRep', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 col-span-2">
                                <option value="">{t.soldBy}</option>
                                {allEmployees.map(e => <option key={e.EmployeeID} value={e.Name}>{e.Name}</option>)}
                            </select>
                            <select value={item.Category} onChange={e => handleItemChange(index, 'Category', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1">
                                {SALE_CATEGORIES.map(cat => <option key={cat} value={cat}>{t[cat] || cat}</option>)}
                            </select>
                            <input type="number" placeholder={t.qty} value={item.Quantity} onChange={e => handleItemChange(index, 'Quantity', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1" />
                            <input type="number" placeholder={t.price} value={item.Price} onChange={e => handleItemChange(index, 'Price', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1" />
                            <div className="flex items-center">
                                <span className="text-white mr-2">{formatCurrency(item.Subtotal)}</span>
                                <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addItem} className="flex items-center text-green-400 hover:text-green-300 mt-2"><PlusCircle size={16} className="mr-2"/>{t.addItem}</button>
                <div className="mt-4">
                    <textarea placeholder={t.notes} value={sale.Notes} onChange={e => handleSaleChange('Notes', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" rows="2"></textarea>
                </div>
                 <div className="flex justify-between items-center mt-6">
                    <span className="text-2xl font-bold text-white">{t.total}: {formatCurrency(totalAmount)}</span>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.saveTransaction}</button>
                </div>
            </div>
        </div>
    )
}
