import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { getWeekNumber } from '../utils/helpers';

export const TimeClock = ({ onExit, t, setNotification, allEmployees, API_BASE_URL }) => {
    const [pin, setPin] = useState('');
    const [employee, setEmployee] = useState(null);
    const [activeLog, setActiveLog] = useState(null);
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (employee || isProcessing) return;
            if (event.key >= '0' && event.key <= '9') {
                handlePinInput(event.key);
            } else if (event.key === 'Backspace') {
                handleDelete();
            } else if (event.key === 'Enter') {
                handlePinSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pin, employee, isProcessing]);

    const handlePinInput = (num) => {
        if (pin.length < 6) {
            setPin(pin + num);
        }
    };

    const handleClear = () => setPin('');
    const handleDelete = () => setPin(pin.slice(0, -1));

    const findOpenLog = async (employeeId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/timelog/open/${employeeId}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error("Error finding open log:", error);
            return null;
        }
    };

    const handlePinSubmit = async () => {
        if (pin.length === 0 || isProcessing) return;
        setIsProcessing(true);
        const foundEmployee = allEmployees.find(e => e.PositionID === pin);
        if (foundEmployee) {
            const openLog = await findOpenLog(foundEmployee.EmployeeID);
            setActiveLog(openLog);
            setEmployee(foundEmployee);
            setMessage('');
        } else {
            setMessage(t.invalidPin);
            setPin('');
        }
        setIsProcessing(false);
    };

    const handleClockIn = async () => {
        if (activeLog || isProcessing) return;
        setIsProcessing(true);
        try {
            const now = new Date();
            await fetch(`${API_BASE_URL}/timelog/clock-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.EmployeeID,
                    storeId: employee.StoreID,
                    week: getWeekNumber(now),
                    year: now.getFullYear(),
                })
            });
            const openLog = await findOpenLog(employee.EmployeeID);
            setActiveLog(openLog);
            setNotification({ message: t.clockInSuccess, type: 'success' });
            setTimeout(resetState, 1500);
        } catch (error) {
            console.error("Error clocking in:", error);
            setNotification({ message: "Error clocking in.", type: 'error' });
        }
        setIsProcessing(false);
    };

    const handleClockOut = async () => {
        if (!activeLog || isProcessing) return;
        setIsProcessing(true);
        try {
            await fetch(`${API_BASE_URL}/timelog/clock-out/${activeLog.TimeLogID}`, {
                method: 'PUT'
            });
            setActiveLog(null);
            setNotification({ message: t.clockOutSuccess, type: 'success' });
            setTimeout(resetState, 1500);
        } catch (error) {
            console.error("Error clocking out:", error);
            setNotification({ message: "Error clocking out.", type: 'error' });
        }
        setIsProcessing(false);
    };

    const resetState = () => {
        setPin('');
        setEmployee(null);
        setActiveLog(null);
        setMessage('');
    };

    if (employee) {
        const statusText = activeLog ? "Status: Clocked In" : "Status: Clocked Out";
        const statusColor = activeLog ? "bg-green-500" : "bg-red-500";
        
        return (
            <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
                <h1 className="text-4xl font-bold text-white mb-2">{t.timeClock}</h1>
                <p className="text-2xl text-gray-300 mb-4">{employee.Name}</p>
                <div className="flex items-center gap-2 mb-8 p-2 bg-gray-800 rounded-lg">
                    <span className={`w-4 h-4 rounded-full ${statusColor}`}></span>
                    <span className="text-white">{statusText}</span>
                </div>
                <div className="flex space-x-4">
                    {!activeLog ? (
                        <button onClick={handleClockIn} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-2xl disabled:opacity-50">{t.clockIn}</button>
                    ) : (
                        <button onClick={handleClockOut} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-2xl disabled:opacity-50">{t.clockOut}</button>
                    )}
                </div>
                <button onClick={resetState} className="mt-8 text-gray-400 hover:text-white">{t.done}</button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
            <button onClick={onExit} className="absolute bottom-4 right-4 flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"><LogOut size={18} className="mr-2" /> {t.exit}</button>
            <h1 className="text-4xl font-bold text-white mb-2">{t.timeClock}</h1>
            <p className="text-lg text-gray-400 mb-8">{t.enterPin}</p>
            <div className="w-full max-w-xs">
                <div className="bg-gray-800 text-white text-3xl text-center tracking-widest rounded-lg mb-4 h-16 flex items-center justify-center">{pin || <span className="text-gray-500">-</span>}</div>
                {message && <p className="text-red-500 text-center mb-4">{message}</p>}
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handlePinInput(num)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl p-4 rounded-lg">{num}</button>
                    ))}
                    <button onClick={handleClear} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-4 rounded-lg">C</button>
                    <button onClick={() => handlePinInput(0)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl p-4 rounded-lg">0</button>
                    <button onClick={handleDelete} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-4 rounded-lg">⌫</button>
                </div>
                <button onClick={handlePinSubmit} disabled={isProcessing} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-xl disabled:opacity-50">{t.unlock}</button>
            </div>
        </div>
    );
};
