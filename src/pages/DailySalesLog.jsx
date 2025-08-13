import React, { useState, useMemo } from 'react';
import { collection, addDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { ShoppingCart, UserCheck, Gift, RefreshCw, Trash2, ChevronUp, ChevronDown, PlusCircle } from 'lucide-react';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FR, TRANSACTION_TYPES, PAYMENT_METHODS, AGE_GROUPS, SALE_CATEGORIES, ALL_STORES } from '../constants';
import { formatCurrency } from '../utils/helpers';

const AddSaleForm = ({ scheduledEmployees, onAddSale, transactionType, t }) => {
    const [transaction, setTransaction] = useState({
        invoiceNumber: '',
        paymentMethod: PAYMENT_METHODS[0],
        ageGroup: AGE_GROUPS[0],
        notes: '',
        type: transactionType
    });
    const [items, setItems] = useState([{ id: crypto.randomUUID(), description: '', category: SALE_CATEGORIES[0], quantity: 1, total: 0, salesRep: scheduledEmployees[0]?.name || '' }]);

    const handleTransactionChange = (e) => {
        const { name, value } = e.target;
        setTransaction(prev => ({ ...prev, [name]: value }));
    };
    
    const handleItemChange = (id, field, value) => {
        setItems(currentItems => currentItems.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleAddItem = () => {
        setItems(current => [...current, { id: crypto.randomUUID(), description: '', category: SALE_CATEGORIES[0], quantity: 1, total: 0, salesRep: scheduledEmployees[0]?.name || '' }]);
    };

    const handleRemoveItem = (id) => {
        setItems(current => current.filter(item => item.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
        onAddSale({ ...transaction, items, total });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mb-4 bg-gray-700/50 rounded-lg space-y-6">
            <h3 className="font-bold text-xl text-white">{transactionType}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input type="text" name="invoiceNumber" placeholder={t.invoiceNum} value={transaction.invoiceNumber} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                <select name="paymentMethod" value={transaction.paymentMethod} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select name="ageGroup" value={transaction.ageGroup} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                    {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                </select>
                <input type="text" name="notes" placeholder={t.notes} value={transaction.notes} onChange={handleTransactionChange} className="lg:col-span-3 bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-lg">{t.items}</h3>
                {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" placeholder={t.description} value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="col-span-3 bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                        <select value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)} className="col-span-2 bg-gray-800 border border-gray-600 rounded-md px-3 py-2">
                            {SALE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="number" placeholder={t.qty} value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="col-span-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        <input type="number" placeholder={t.total} value={item.total} onChange={e => handleItemChange(item.id, 'total', Number(e.target.value))} className="col-span-2 bg-gray-800 border border-gray-600 rounded-md px-3 py-2" step="0.01" />
                        <select value={item.salesRep} onChange={e => handleItemChange(item.id, 'salesRep', e.target.value)} className="col-span-3 bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                            {scheduledEmployees.filter(e => e.name).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                        </select>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="col-span-1 text-red-500 hover:text-red-400 disabled:opacity-50" disabled={items.length <= 1}><Trash2 size={18} /></button>
                    </div>
                ))}
                <button type="button" onClick={handleAddItem} className="flex items-center text-sm text-blue-400 hover:text-blue-300 mt-2"><PlusCircle size={16} className="mr-1" /> {t.addItem}</button>
            </div>
            
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">{t.saveTransaction}</button>
        </form>
    );
};

const AddReturnForm = ({ scheduledEmployees, onAddSale, t }) => {
    const [transaction, setTransaction] = useState({
        invoiceNumber: '',
        salesRep: scheduledEmployees[0]?.name || '', // Person processing the return
        paymentMethod: PAYMENT_METHODS[0],
        notes: '',
        type: TRANSACTION_TYPES.RETURN,
        originalStore: '',
        originalSalesPerson: '',
        originalSalesPersonId: ''
    });
    const [items, setItems] = useState([{ id: crypto.randomUUID(), description: '', category: SALE_CATEGORIES[0], quantity: 1, total: 0, salesRep: scheduledEmployees[0]?.name || '' }]);

    const handleTransactionChange = (e) => {
        const { name, value } = e.target;
        setTransaction(prev => ({ ...prev, [name]: value }));
    };
    
    const handleItemChange = (id, field, value) => {
        setItems(currentItems => currentItems.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleAddItem = () => {
        setItems(current => [...current, { id: crypto.randomUUID(), description: '', category: SALE_CATEGORIES[0], quantity: 1, total: 0, salesRep: scheduledEmployees[0]?.name || '' }]);
    };

    const handleRemoveItem = (id) => {
        setItems(current => current.filter(item => item.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
        const finalTotal = -Math.abs(total);
        onAddSale({ ...transaction, items, total: finalTotal });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mb-4 bg-gray-700/50 rounded-lg space-y-6">
            <h3 className="font-bold text-xl text-white">{t.RETURN || 'Return'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" name="invoiceNumber" placeholder={t.invoiceNum} value={transaction.invoiceNumber} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                <select name="originalStore" value={transaction.originalStore} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                    <option value="">{t.originalStore}</option>
                    {ALL_STORES.map(store => <option key={store} value={store}>{store}</option>)}
                </select>
                <input type="text" name="originalSalesPerson" placeholder={t.originalSalesPerson} value={transaction.originalSalesPerson} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                <input type="text" name="originalSalesPersonId" placeholder={t.originalEmployeeId} value={transaction.originalSalesPersonId} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                <select name="paymentMethod" value={transaction.paymentMethod} onChange={handleTransactionChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="text" name="notes" placeholder={t.returnReason} value={transaction.notes} onChange={handleTransactionChange} className="lg:col-span-3 bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
            </div>

            <div className="space-y-2">
                <h3 className="font-bold text-lg">{t.items}</h3>
                {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" placeholder={t.description} value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="col-span-4 bg-gray-800 border border-gray-600 rounded-md px-3 py-2" />
                        <select value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)} className="col-span-3 bg-gray-800 border border-gray-600 rounded-md px-3 py-2">
                            {SALE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="number" placeholder={t.qty} value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="col-span-2 bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        <input type="number" placeholder={t.total} value={item.total} onChange={e => handleItemChange(item.id, 'total', Number(e.target.value))} className="col-span-2 bg-gray-800 border border-gray-600 rounded-md px-3 py-2" step="0.01" />
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="col-span-1 text-red-500 hover:text-red-400 disabled:opacity-50" disabled={items.length <= 1}><Trash2 size={18} /></button>
                    </div>
                ))}
                <button type="button" onClick={handleAddItem} className="flex items-center text-sm text-blue-400 hover:text-blue-300 mt-2"><PlusCircle size={16} className="mr-1" /> {t.addItem}</button>
            </div>
            
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">{t.processReturn}</button>
        </form>
    );
};


const AddGiftCardForm = ({ scheduledEmployees, onAddSale, t }) => {
    const [transaction, setTransaction] = useState({
        invoiceNumber: '',
        salesRep: scheduledEmployees[0]?.name || '',
        paymentMethod: PAYMENT_METHODS[0],
        ageGroup: AGE_GROUPS[0],
        notes: '',
        type: TRANSACTION_TYPES.GIFT_CARD,
        total: 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTransaction(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddSale({ ...transaction, total: Number(transaction.total) });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mb-4 bg-gray-700/50 rounded-lg space-y-6">
            <h3 className="font-bold text-xl text-white">{t.GIFT_CARD || 'Gift Card'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" name="invoiceNumber" placeholder={t.invoiceNum} value={transaction.invoiceNumber} onChange={handleChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                <input type="number" name="total" placeholder={t.amount} value={transaction.total} onChange={handleChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" step="0.01" />
                <select name="salesRep" value={transaction.salesRep} onChange={handleChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                    {scheduledEmployees.filter(e => e.name).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                </select>
                <select name="paymentMethod" value={transaction.paymentMethod} onChange={handleChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="text" name="notes" placeholder={t.notes} value={transaction.notes} onChange={handleChange} className="lg:col-span-4 bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
            </div>
             <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">{t.saveTransaction}</button>
        </form>
    );
};

export const DailySalesLog = ({ sales, schedule, currentWeek, currentYear, db, appId, selectedStore, t, language }) => {
    const [activeDay, setActiveDay] = useState(new Date().getDay());
    const [formType, setFormType] = useState(null); // null, 'REGULAR', 'EMPLOYEE', 'GIFT_CARD', 'RETURN'
    const [expandedTransaction, setExpandedTransaction] = useState(null);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    
    const salesForActiveDay = useMemo(() => {
        return sales.filter(s => s.day === DAYS_OF_WEEK[activeDay]).sort((a, b) => (a.invoiceNumber || "").localeCompare(b.invoiceNumber || ""));
    }, [sales, activeDay]);

    const handleAddSale = async (newSaleData) => {
        if (!db) return;
        const basePath = `artifacts/${appId}/public/data`;
        const salesCollectionRef = collection(db, `${basePath}/sales`);
        
        const dataToSave = {
            ...newSaleData,
            week: currentWeek,
            year: currentYear,
            day: DAYS_OF_WEEK[activeDay],
        };

        try {
            if (newSaleData.type === TRANSACTION_TYPES.RETURN && newSaleData.originalStore && newSaleData.originalStore !== selectedStore) {
                const batch = writeBatch(db);

                const processingStoreData = {
                    ...dataToSave,
                    storeId: selectedStore,
                    notes: `Return for store ${newSaleData.originalStore}. Original salesperson: ${newSaleData.originalSalesPerson} (${newSaleData.originalSalesPersonId})`
                };
                const processingDocRef = doc(salesCollectionRef);
                batch.set(processingDocRef, processingStoreData);

                const originatingStoreData = {
                    ...dataToSave,
                    storeId: newSaleData.originalStore,
                    notes: `Return processed at store ${selectedStore}.`
                };
                const originatingDocRef = doc(salesCollectionRef);
                batch.set(originatingDocRef, originatingStoreData);
                
                await batch.commit();

            } else {
                 await addDoc(salesCollectionRef, {...dataToSave, storeId: selectedStore});
            }
            setFormType(null);
        } catch (error) {
            console.error("Error adding sale:", error);
        }
    };
    
    const handleDeleteSale = async (e, saleId) => {
        e.stopPropagation();
        if (!db) return;
        try {
            const saleDocRef = doc(db, `artifacts/${appId}/public/data/sales`, saleId);
            await deleteDoc(saleDocRef);
        } catch (error) {
            console.error("Error deleting sale:", error);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <div className="flex border-b border-gray-700">
                    {weekDays.map((day, index) => (
                        <button key={day} onClick={() => setActiveDay(index)}
                                className={`py-2 px-4 text-sm font-medium transition-colors duration-200 ${activeDay === index ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'}`}>
                            {day}
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    {formType ? (
                         <button onClick={() => setFormType(null)} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">{t.cancel}</button>
                    ) : (
                        <>
                            <button onClick={() => setFormType(TRANSACTION_TYPES.REGULAR)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"><ShoppingCart size={16} className="mr-2"/>{t.REGULAR || 'Regular Sale'}</button>
                            <button onClick={() => setFormType(TRANSACTION_TYPES.EMPLOYEE)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"><UserCheck size={16} className="mr-2"/>{t.EMPLOYEE || 'Employee'}</button>
                            <button onClick={() => setFormType(TRANSACTION_TYPES.GIFT_CARD)} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"><Gift size={16} className="mr-2"/>{t.GIFT_CARD || 'Gift Card'}</button>
                            <button onClick={() => setFormType(TRANSACTION_TYPES.RETURN)} className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"><RefreshCw size={16} className="mr-2"/>{t.RETURN || 'Return'}</button>
                        </>
                    )}
                </div>
            </div>

            {formType === TRANSACTION_TYPES.REGULAR && <AddSaleForm t={t} transactionType={TRANSACTION_TYPES.REGULAR} scheduledEmployees={schedule.rows || []} onAddSale={handleAddSale} />}
            {formType === TRANSACTION_TYPES.EMPLOYEE && <AddSaleForm t={t} transactionType={TRANSACTION_TYPES.EMPLOYEE} scheduledEmployees={schedule.rows || []} onAddSale={handleAddSale} />}
            {formType === TRANSACTION_TYPES.GIFT_CARD && <AddGiftCardForm t={t} onAddSale={handleAddSale} scheduledEmployees={schedule.rows || []} />}
            {formType === TRANSACTION_TYPES.RETURN && <AddReturnForm t={t} onAddSale={handleAddSale} scheduledEmployees={schedule.rows || []} />}
            
            <div className="overflow-x-auto mt-6">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t.invoiceNum}</th><th scope="col" className="px-6 py-3">{t.type}</th><th scope="col" className="px-6 py-3">{t.salesRep}</th><th scope="col" className="px-6 py-3">{t.items}</th><th scope="col" className="px-6 py-3">{t.total}</th><th scope="col" className="px-6 py-3">{t.payment}</th><th scope="col" className="px-6 py-3">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesForActiveDay.map(sale => {
                            const reps = [...new Set((sale.items || []).map(i => i.salesRep).filter(Boolean))];
                            return (
                            <React.Fragment key={sale.id}>
                                <tr className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer" onClick={() => setExpandedTransaction(expandedTransaction === sale.id ? null : sale.id)}>
                                    <td className="px-6 py-4">{sale.invoiceNumber}</td>
                                    <td className="px-6 py-4">{sale.type || TRANSACTION_TYPES.REGULAR}</td>
                                    <td className="px-6 py-4">{reps.join(', ')}</td>
                                    <td className="px-6 py-4">{sale.items?.length || 0}</td><td className={`px-6 py-4 font-bold ${sale.type === TRANSACTION_TYPES.RETURN ? 'text-red-400' : 'text-white'}`}>{formatCurrency(sale.total)}</td><td className="px-6 py-4">{sale.paymentMethod}</td>
                                    <td className="px-6 py-4 flex items-center space-x-4">
                                        <button onClick={(e) => handleDeleteSale(e, sale.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                        {expandedTransaction === sale.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                                    </td>
                                </tr>
                                {expandedTransaction === sale.id && sale.type !== TRANSACTION_TYPES.GIFT_CARD && (
                                    <tr className="bg-gray-800/50">
                                        <td colSpan="7" className="p-4">
                                            <div className="bg-gray-900 p-4 rounded-lg">
                                                <h4 className="font-bold mb-2 text-white">{t.itemsInTransaction.replace('{invoice}', sale.invoiceNumber)}</h4>
                                                {sale.notes && <p className="text-sm text-yellow-400 mb-2">{t.note.replace('{notes}', sale.notes)}</p>}
                                                <table className="w-full text-sm">
                                                    <thead className="text-xs text-gray-400 uppercase">
                                                        <tr><th className="px-4 py-2 text-left">{t.description}</th><th className="px-4 py-2 text-left">{t.category}</th><th className="px-4 py-2 text-right">{t.qty}</th><th className="px-4 py-2 text-left">{t.soldBy}</th><th className="px-4 py-2 text-right">{t.total}</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {(sale.items || []).map((item, idx) => (
                                                            <tr key={idx} className="border-b border-gray-700/50">
                                                                <td className="px-4 py-2">{item.description}</td><td className="px-4 py-2">{item.category}</td><td className="px-4 py-2 text-right">{item.quantity}</td><td className="px-4 py-2 text-left">{item.salesRep}</td><td className="px-4 py-2 text-right">{formatCurrency(item.total)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )})}
                    </tbody>
                </table>
                {salesForActiveDay.length === 0 && <p className="text-center py-8 text-gray-500">{t.noSalesForDay.replace('{day}', weekDays[activeDay])}</p>}
            </div>
        </div>
    );
};
