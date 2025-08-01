import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, query, where } from 'firebase/firestore';

import { firebaseConfig, appId } from './firebaseConfig';
import { translations } from './translations';
import { ALL_STORES } from './constants'; 
import { getWeekNumber } from './utils/helpers';

import { Sidebar } from './components/Sidebar';
import { StoreSelector } from './components/StoreSelector';
import { PasscodeModal } from './components/PasscodeModal';
import { Notification } from './components/Notification';
import { WeekNavigator } from './components/WeekNavigator';
import { Dashboard } from './pages/Dashboard';
import { AdminPage } from './pages/AdminPage';
import { PerformanceGoals } from './pages/PerformanceGoals';
import { DailyPlanner } from './pages/DailyPlanner';
import { DailySalesLog } from './pages/DailySalesLog';
import { Schedule } from './pages/Schedule';
import { STC } from './pages/STC';
import { Payroll } from './pages/Payroll';
import { Reports } from './pages/Reports';
import { TimeClock } from './pages/TimeClock';

import { Building2 } from 'lucide-react';

let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

export default function App() {
    const [view, setView] = useState('storeSelector');
    const [currentPage, setCurrentPage] = useState('Dashboard');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [selectedStore, setSelectedStore] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [language, setLanguage] = useState(navigator.language.startsWith('fr') ? 'fr' : 'en');
    
    const [allEmployees, setAllEmployees] = useState([]);
    const [allSchedules, setAllSchedules] = useState([]);
    const [allSales, setAllSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });
    const [stcData, setStcData] = useState({ days: {} });
    const [performanceGoals, setPerformanceGoals] = useState({});
    const [payroll, setPayroll] = useState({});
    const [dailyPlanner, setDailyPlanner] = useState(null);
    
    const [notification, setNotification] = useState(null);
    const [isPayrollUnlocked, setIsPayrollUnlocked] = useState(false);
    const [passcodeChallenge, setPasscodeChallenge] = useState(null);
    const [isLoadingStoreData, setIsLoadingStoreData] = useState(false);

    const t = translations[language];
    const currentWeek = useMemo(() => getWeekNumber(currentDate), [currentDate]);
    const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) setIsAuthReady(true);
            else try { await signInAnonymously(auth); } catch (e) { console.error(e); }
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (!isAuthReady || !db) return;
        setIsLoading(true);
        const unsub = onSnapshot(collection(db, `artifacts/${appId}/public/data/employees`), (snap) => {
            setAllEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setIsLoading(false);
        });
        return () => unsub();
    }, [isAuthReady, db]);

    useEffect(() => {
        if (!isAuthReady || !db) return;
        const qSales = query(collection(db, `artifacts/${appId}/public/data/sales`), where("week", "==", currentWeek), where("year", "==", currentYear));
        const qSchedules = query(collection(db, `artifacts/${appId}/public/data/schedules`), where("week", "==", currentWeek), where("year", "==", currentYear));

        const unsubSales = onSnapshot(qSales, (snap) => setAllSales(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubSchedules = onSnapshot(qSchedules, (snap) => setAllSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubSales(); unsubSchedules(); };
    }, [isAuthReady, db, currentWeek, currentYear]);

    useEffect(() => {
        if (!isAuthReady || !db || !selectedStore) return;
        
        setIsLoadingStoreData(true);

        setSales(allSales.filter(s => s.storeId === selectedStore));

        const unsubStc = onSnapshot(doc(db, `artifacts/${appId}/public/data/stc`, `${selectedStore}-${currentYear}-W${currentWeek}`), (doc) => setStcData(doc.exists() ? doc.data() : { days: {} }));
        const unsubGoals = onSnapshot(doc(db, `artifacts/${appId}/public/data/performance_goals`, `${selectedStore}-${currentYear}-W${currentWeek}`), (doc) => setPerformanceGoals(doc.exists() ? doc.data() : {}));
        const unsubPayroll = onSnapshot(doc(db, `artifacts/${appId}/public/data/payrolls`, `${selectedStore}-${currentYear}-W${currentWeek}`), (doc) => setPayroll(doc.exists() ? doc.data() : {}));
        const unsubPlanner = onSnapshot(doc(db, `artifacts/${appId}/public/data/planners`, `${selectedStore}-${currentDate.toISOString().split('T')[0]}`), (doc) => setDailyPlanner(doc.exists() ? { id: doc.id, ...doc.data() } : null));

        const currentStoreSchedule = allSchedules.find(s => s.id === `${selectedStore}-${currentYear}-W${currentWeek}`);
        const storeEmployees = allEmployees.filter(emp => emp.associatedStore === selectedStore);

        if (currentStoreSchedule) {
            const updatedRows = [...currentStoreSchedule.rows];
            const scheduleEmployeeIds = new Set(updatedRows.map(r => r.employeeId));
            
            storeEmployees.forEach(emp => {
                if (!scheduleEmployeeIds.has(emp.positionId)) {
                    updatedRows.push({ id: emp.id, name: emp.name, employeeId: emp.positionId, jobTitle: emp.jobTitle, objective: 0, shifts: {}, scheduledHours: {}, actualHours: {}, dailyObjectives: {} });
                }
            });

            const finalRows = updatedRows.map(row => {
                const empData = allEmployees.find(e => e.id === row.id);
                if (empData && empData.associatedStore === selectedStore) {
                    return { ...row, name: empData.name, jobTitle: empData.jobTitle };
                }
                if (empData && empData.associatedStore !== selectedStore) {
                    return row;
                }
                if (!empData) return null;
                return row;
            }).filter(Boolean);
            setSchedule({ ...currentStoreSchedule, rows: finalRows });
        } else if (selectedStore && allEmployees.length > 0) {
            const newScheduleRows = storeEmployees.map(emp => ({ id: emp.id, name: emp.name, employeeId: emp.positionId, jobTitle: emp.jobTitle, objective: 0, shifts: {}, scheduledHours: {}, actualHours: {}, dailyObjectives: {} }));
            setSchedule({ rows: newScheduleRows, week: currentWeek, year: currentYear });
        }
        
        setIsLoadingStoreData(false);

        return () => { unsubStc(); unsubGoals(); unsubPayroll(); unsubPlanner(); };
    }, [isAuthReady, db, selectedStore, currentWeek, currentYear, currentDate, allSales, allSchedules, allEmployees]);

    const handleNavClick = (page) => {
        if (page === 'Payroll' && !isPayrollUnlocked) {
             setPasscodeChallenge({ type: 'payroll' });
        } else {
            setCurrentPage(page);
        }
        if (page !== 'Payroll') {
            setIsPayrollUnlocked(false);
        }
    };

    const handlePasscodeSuccess = () => {
        if (passcodeChallenge?.type === 'payroll') {
            setIsPayrollUnlocked(true);
            setCurrentPage('Payroll');
        } else if (passcodeChallenge?.type === 'store') {
            setIsLoadingStoreData(true);
            setSelectedStore(passcodeChallenge.id);
            setView('dashboard');
            setIsPayrollUnlocked(false);
        } else if (passcodeChallenge?.type === 'admin') {
            setView('admin');
        }
        setPasscodeChallenge(null);
    };
    
    const handleChangeStore = () => {
        setSelectedStore(null);
        setView('storeSelector');
        setIsPayrollUnlocked(false);
    };

    const renderPage = () => {
        if (isLoading || isLoadingStoreData) {
             return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
        }
        const props = { db, appId, t, language, setNotification, selectedStore, currentWeek, currentYear, currentDate, allEmployees, allSchedules, allSales, sales, schedule, stcData, performanceGoals, payroll, dailyPlanner };
        switch (currentPage) {
            case 'Dashboard': return <Dashboard {...props} />;
            case 'Performance Goals': return <PerformanceGoals {...props} />;
            case 'Daily Planner': return <DailyPlanner {...props} />;
            case 'Schedule': return <Schedule {...props} />;
            case 'STC': return <STC {...props} />;
            case 'Payroll': return <Payroll {...props} />;
            case 'Daily Sales Log': return <DailySalesLog {...props} />;
            case 'Reports': return <Reports {...props} />;
            case 'Time Clock': return <TimeClock {...props} />;
            default: return <Dashboard {...props} />;
        }
    };

    if (!isAuthReady) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;

    if (view === 'storeSelector') return (
        <>
            <StoreSelector onSelectStore={(id) => setPasscodeChallenge({ type: 'store', id })} onAdminClick={() => setPasscodeChallenge({ type: 'admin' })} onTimeClockClick={() => { setView('timeClock'); setSelectedStore(null); }} language={language} setLanguage={setLanguage} t={t} stores={ALL_STORES} />
            {passcodeChallenge && <PasscodeModal correctPasscode={passcodeChallenge.type === 'admin' ? '9160' : passcodeChallenge.id} onSuccess={handlePasscodeSuccess} onClose={() => setPasscodeChallenge(null)} t={t} />}
        </>
    );
    
    if (view === 'admin') return <AdminPage onExit={() => setView('storeSelector')} {...{ t, db, appId, setNotification, allEmployees }} />;
    
    if (view === 'timeClock') return <TimeClock onExit={() => setView('storeSelector')} {...{ t, db, appId, setNotification, allEmployees }} />;

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <Sidebar currentPage={currentPage} onNavClick={handleNavClick} onChangeStore={handleChangeStore} t={t} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center z-10">
                    <h1 className="text-2xl font-bold text-gray-100">{t[currentPage.toLowerCase().replace(/ /g, '')] || currentPage}</h1>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg">
                           <Building2 size={16} className="text-gray-400"/>
                           <span className="font-bold text-white">{t.store}: {selectedStore}</span>
                        </div>
                        <WeekNavigator {...{currentDate, setCurrentDate, currentWeek, language}} />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-900">{renderPage()}</div>
            </main>
            {passcodeChallenge?.type === 'payroll' && <PasscodeModal correctPasscode="9160" onSuccess={handlePasscodeSuccess} onClose={() => setPasscodeChallenge(null)} t={t} />}
            {notification && <Notification {...notification} />}
        </div>
    );
}
