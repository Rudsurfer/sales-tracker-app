import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { Clock, LogOut } from 'lucide-react';

export const TimeClock = ({ onExit, t, db, appId, setNotification, allEmployees, currentWeek, currentYear }) => {
    const [pin, setPin] = useState('');
    const [employee, setEmployee] = useState(null);
    const [lastClockIn, setLastClockIn] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (employee) return;
            if (event.key >= '0' && event.key <= '9') {
                handlePinInput(event.key);
            } else if (event.key === 'Backspace') {
                handleDelete();
            } else if (event.key === 'Enter') {
                handlePinSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [pin, employee]);

    const handlePinInput = (num) => {
        if (pin.length < 6) {
            setPin(pin + num);
        }
    };

    const handleClear = () => setPin('');
    const handleDelete = () => setPin(pin.slice(0, -1));

    const handlePinSubmit = async () => {
        if (pin.length === 0) return;
        const foundEmployee = allEmployees.find(e => e.positionId === pin);
        if (foundEmployee) {
            setEmployee(foundEmployee);
            const timeLogRef = collection(db, `artifacts/${appId}/public/data/time_logs`);
            const q = query(timeLogRef, where("employeeId", "==", foundEmployee.id), orderBy("clockIn", "desc"), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const lastLog = querySnapshot.docs[0].data();
                if (!lastLog.clockOut) {
                    setLastClockIn({ id: querySnapshot.docs[0].id, ...lastLog });
                } else {
                    setLastClockIn(null);
                }
            } else {
                setLastClockIn(null);
            }
            setMessage('');
        } else {
            setMessage(t.invalidPin);
            setPin('');
        }
    };

    const handleClockIn = async () => {
        if (lastClockIn) {
            setNotification({ message: t.alreadyClockedIn, type: 'error' });
            return;
        }
        try {
            const timeLogRef = collection(db, `artifacts/${appId}/public/data/time_logs`);
            const newLog = {
                employeeId: employee.id,
                storeId: employee.associatedStore,
                clockIn: serverTimestamp(),
                clockOut: null,
                week: currentWeek,
                year: currentYear,
            };
            const docRef = await addDoc(timeLogRef, newLog);
            setLastClockIn({ id: docRef.id, ...newLog, clockIn: new Date() }); // Update local state immediately
            setNotification({ message: t.clockInSuccess, type: 'success' });
            setTimeout(resetState, 2000);
        } catch (error) {
            console.error("Error clocking in:", error);
        }
    };

    const handleClockOut = async () => {
        if (!lastClockIn) {
            setNotification({ message: t.notClockedIn, type: 'error' });
            return;
        }
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/time_logs`, lastClockIn.id);
            await updateDoc(docRef, {
                clockOut: serverTimestamp()
            });
            setLastClockIn(null); // Update local state immediately
            setNotification({ message: t.clockOutSuccess, type: 'success' });
            setTimeout(resetState, 2000);
        } catch (error) {
            console.error("Error clocking out:", error);
        }
    };

    const resetState = () => {
        setPin('');
        setEmployee(null);
        setLastClockIn(null);
        setMessage('');
    };

    if (employee) {
        const statusText = lastClockIn ? "Status: Clocked In" : "Status: Clocked Out";
        const statusColor = lastClockIn ? "bg-green-500" : "bg-red-500";
        
        return (
            <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
                <h1 className="text-4xl font-bold text-white mb-2">{t.timeClock}</h1>
                <p className="text-2xl text-gray-300 mb-4">{employee.name}</p>
                <div className="flex items-center gap-2 mb-8 p-2 bg-gray-800 rounded-lg">
                    <span className={`w-4 h-4 rounded-full ${statusColor}`}></span>
                    <span className="text-white">{statusText}</span>
                </div>
                <div className="flex space-x-4">
                    {!lastClockIn ? (
                        <button onClick={handleClockIn} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-2xl">{t.clockIn}</button>
                    ) : (
                        <button onClick={handleClockOut} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-2xl">{t.clockOut}</button>
                    )}
                </div>
                <button onClick={resetState} className="mt-8 text-gray-400 hover:text-white">{t.cancel}</button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
            <button onClick={onExit} className="absolute top-4 left-4 flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"><LogOut size={18} className="mr-2" /> {t.exit}</button>
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
                <button onClick={handlePinSubmit} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-xl">{t.unlock}</button>
            </div>
        </div>
    );
};
