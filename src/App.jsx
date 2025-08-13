import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import { firebaseConfig } from './firebaseConfig';
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

const API_BASE_URL = 'https://vq_api.rudsak.com/api';

let app, auth;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
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
    const [isCoreDataLoading, setIsCoreDataLoading] = useState(true);
    
    const [notification, setNotification] = useState(null);
    const [isPayrollUnlocked, setIsPayrollUnlocked] = useState(false);
    const [passcodeChallenge, setPasscodeChallenge] = useState(null);

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
        const fetchEmployees = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/employees`);
                const data = await response.json();
                setAllEmployees(data);
            } catch (error) {
                console.error("Error fetching employees:", error);
            } finally {
                setIsCoreDataLoading(false);
            }
        };
        if (isAuthReady) {
            fetchEmployees();
        }
    }, [isAuthReady]);

    const handleNavClick = (page) => {
        if (page === 'Time Clock') {
            setView('timeClock');
            return;
        }
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
        const props = { t, language, setNotification, selectedStore, currentWeek, currentYear, currentDate, allEmployees, API_BASE_URL };
        switch (currentPage) {
            case 'Dashboard': return <Dashboard {...props} />;
            case 'Performance Goals': return <PerformanceGoals {...props} />;
            case 'Daily Planner': return <DailyPlanner {...props} />;
            case 'Schedule': return <Schedule {...props} />;
            case 'STC': return <STC {...props} />;
            case 'Payroll': return <Payroll {...props} />;
            case 'Daily Sales Log': return <DailySalesLog {...props} />;
            case 'Reports': return <Reports {...props} />;
            default: return <Dashboard {...props} />;
        }
    };

    if (!isAuthReady || isCoreDataLoading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;

    if (view === 'storeSelector') return (
        <>
            <StoreSelector onSelectStore={(id) => setPasscodeChallenge({ type: 'store', id })} onAdminClick={() => setPasscodeChallenge({ type: 'admin' })} onTimeClockClick={() => { setView('timeClock'); setSelectedStore(null); }} language={language} setLanguage={setLanguage} t={t} stores={ALL_STORES} />
            {passcodeChallenge && <PasscodeModal correctPasscode={passcodeChallenge.type === 'admin' ? '9160' : passcodeChallenge.id} onSuccess={handlePasscodeSuccess} onClose={() => setPasscodeChallenge(null)} t={t} />}
        </>
    );
    
    if (view === 'admin') return <AdminPage onExit={() => setView('storeSelector')} {...{ t, setNotification, API_BASE_URL }} />;
    
    if (view === 'timeClock') return <TimeClock onExit={() => setView(selectedStore ? 'dashboard' : 'storeSelector')} {...{ t, setNotification, allEmployees, API_BASE_URL }} />;

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