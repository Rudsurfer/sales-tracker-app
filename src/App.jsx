import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, query, where, getDocs, getDoc } from 'firebase/firestore';

// Import all components
import { firebaseConfig, appId } from './firebaseConfig';
import { translations } from './translations';
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

// --- Firebase Initialization ---
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

    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });
    const [stcData, setStcData] = useState({ days: {} });
    const [performanceGoals, setPerformanceGoals] = useState({});
    const [payroll, setPayroll] = useState({});
    const [dailyPlanner, setDailyPlanner] = useState(null);
    
    const [notification, setNotification] = useState(null);
    const [isPayrollUnlocked, setIsPayrollUnlocked] = useState(false);
    const [passcodeChallenge, setPasscodeChallenge] = useState(null);

    const t = translations[language];

    const getWeekNumber = (d) => {
        const date = new Date(d.valueOf());
        date.setHours(0, 0, 0, 0);
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const firstDayOfWeek = firstDayOfYear.getDay();
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfWeek + 1) / 7);
    };

    const currentWeek = useMemo(() => getWeekNumber(currentDate), [currentDate]);
    const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);

    // --- Firebase Authentication Effect ---
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthReady(true);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Authentication error:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);
    
    // Notification Timeout Effect
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- Firestore Data Fetching Effects ---
    useEffect(() => {
        if (!isAuthReady || !db) return;

        // Fetch all employees (for admin, guest scheduling, etc.)
        const employeesCollectionRef = collection(db, `artifacts/${appId}/public/data/employees`);
        const unsubEmployees = onSnapshot(employeesCollectionRef, (snapshot) => {
            setAllEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => console.error("Error fetching all employees:", err));

        return () => unsubEmployees();
    }, [isAuthReady, db]);

    // Fetch all data for the current week across all stores (for guest employee calculations)
    useEffect(() => {
        if (!isAuthReady || !db) return;
        
        const basePath = `artifacts/${appId}/public/data`;
        const salesQuery = query(collection(db, `${basePath}/sales`), where("week", "==", currentWeek), where("year", "==", currentYear));
        const schedulesQuery = query(collection(db, `${basePath}/schedules`), where("week", "==", currentWeek), where("year", "==", currentYear));

        const unsubAllSales = onSnapshot(salesQuery, (snapshot) => {
            setAllSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => console.error("Error fetching all sales:", err));

        const unsubAllSchedules = onSnapshot(schedulesQuery, (snapshot) => {
            setAllSchedules(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => console.error("Error fetching all schedules:", err));

        return () => {
            unsubAllSales();
            unsubAllSchedules();
        };

    }, [isAuthReady, db, currentWeek, currentYear]);


    // Fetch data specific to the selected store
    useEffect(() => {
        if (!isAuthReady || !db || !selectedStore) return;

        const basePath = `artifacts/${appId}/public/data`;

        // Filter all weekly sales for the selected store
        setSales(allSales.filter(s => s.storeId === selectedStore));

        // STC Data for selected store
        const stcDocRef = doc(db, `${basePath}/stc`, `${selectedStore}-${currentYear}-W${currentWeek}`);
        const unsubStc = onSnapshot(stcDocRef, (doc) => setStcData(doc.exists() ? doc.data() : { days: {}, week: currentWeek, year: currentYear }), err => console.error("Error fetching STC data:", err));

        // Goals Data for selected store
        const goalsDocRef = doc(db, `${basePath}/performance_goals`, `${selectedStore}-${currentYear}-W${currentWeek}`);
        const unsubGoals = onSnapshot(goalsDocRef, (doc) => setPerformanceGoals(doc.exists() ? doc.data() : {}), err => console.error("Error fetching performance goals:", err));
        
        // Payroll Data for selected store
        const payrollDocRef = doc(db, `${basePath}/payrolls`, `${selectedStore}-${currentYear}-W${currentWeek}`);
        const unsubPayroll = onSnapshot(payrollDocRef, (doc) => setPayroll(doc.exists() ? doc.data() : {}), err => console.error("Error fetching payroll:", err));
        
        // Planner Data for selected store and date
        const plannerDocId = `${selectedStore}-${currentDate.toISOString().split('T')[0]}`;
        const plannerDocRef = doc(db, `${basePath}/planners`, plannerDocId);
        const unsubPlanner = onSnapshot(plannerDocRef, (doc) => {
            setDailyPlanner(doc.exists() ? { id: doc.id, ...doc.data() } : { id: plannerDocId, priorities: [], tasks: [] });
        }, err => console.error("Error fetching planner:", err));

        return () => {
            unsubStc();
            unsubGoals();
            unsubPayroll();
            unsubPlanner();
        };
    }, [isAuthReady, db, selectedStore, currentWeek, currentYear, currentDate, allSales]);

    // Schedule Reconciliation Effect
    useEffect(() => {
        const currentStoreSchedule = allSchedules.find(s => s.id === `${selectedStore}-${currentYear}-W${currentWeek}`);
        const storeEmployees = allEmployees.filter(emp => emp.associatedStore === selectedStore);

        if (currentStoreSchedule) {
            // Reconcile existing schedule with current employee list
            const updatedRows = [...currentStoreSchedule.rows];
            const scheduleEmployeeIds = new Set(updatedRows.map(r => r.employeeId));
            
            // Add new employees
            storeEmployees.forEach(emp => {
                if (!scheduleEmployeeIds.has(emp.positionId)) {
                    updatedRows.push({
                        id: emp.id, name: emp.name, employeeId: emp.positionId, jobTitle: emp.jobTitle,
                        objective: 0, shifts: {}, scheduledHours: {}, actualHours: {}, dailyObjectives: {}
                    });
                }
            });

            // Update details and remove employees no longer in the store
            const finalRows = updatedRows.map(row => {
                const empData = allEmployees.find(e => e.id === row.id);
                if (empData && empData.associatedStore === selectedStore) {
                    return { ...row, name: empData.name, jobTitle: empData.jobTitle };
                }
                if (empData && empData.associatedStore !== selectedStore) {
                    return null; // This row will be filtered out
                }
                return row; // Keep guest employees
            }).filter(Boolean);

            setSchedule({ ...currentStoreSchedule, rows: finalRows });

        } else if (selectedStore && allEmployees.length > 0) {
            // Create a new schedule if one doesn't exist
            const newScheduleRows = storeEmployees.map(emp => ({
                id: emp.id, name: emp.name, employeeId: emp.positionId, jobTitle: emp.jobTitle,
                objective: 0, shifts: {}, scheduledHours: {}, actualHours: {}, dailyObjectives: {}
            }));
            setSchedule({ rows: newScheduleRows, week: currentWeek, year: currentYear });
        }
    }, [allSchedules, allEmployees, selectedStore, currentWeek, currentYear]);


    const handleNavClick = (page) => {
        if (page === 'Payroll' && !isPayrollUnlocked) {
            setPasscodeChallenge({ type: 'payroll' });
        } else {
            setCurrentPage(page);
        }
    };

    const handlePasscodeSuccess = () => {
        if (passcodeChallenge?.type === 'payroll') {
            setIsPayrollUnlocked(true);
            setCurrentPage('Payroll');
        } else if (passcodeChallenge?.type === 'store') {
            setSelectedStore(passcodeChallenge.id);
            setView('dashboard');
            setIsPayrollUnlocked(false); // Re-lock payroll on store change
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
        const props = { 
            db, appId, t, language, setNotification,
            selectedStore, currentWeek, currentYear, currentDate,
            allEmployees, allSchedules, allSales,
            sales, schedule, stcData, performanceGoals, payroll, dailyPlanner,
        };
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

    if (!isAuthReady) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    if (view === 'storeSelector') {
        return (
            <>
                <StoreSelector 
                    onSelectStore={(storeId) => setPasscodeChallenge({ type: 'store', id: storeId })} 
                    onAdminClick={() => setPasscodeChallenge({ type: 'admin' })}
                    language={language} 
                    setLanguage={setLanguage} 
                    t={t} 
                />
                {passcodeChallenge && <PasscodeModal 
                    correctPasscode={passcodeChallenge.type === 'admin' ? '9160' : passcodeChallenge.id} 
                    onSuccess={handlePasscodeSuccess} 
                    onClose={() => setPasscodeChallenge(null)} 
                    t={t} 
                />}
            </>
        );
    }
    
    if (view === 'admin') {
        return <AdminPage onExit={() => setView('storeSelector')} t={t} db={db} appId={appId} setNotification={setNotification} />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <Sidebar currentPage={currentPage} onNavClick={(page) => {setCurrentPage(page); if(page !== 'Payroll') setIsPayrollUnlocked(false);}} onChangeStore={handleChangeStore} t={t} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center z-10">
                    <h1 className="text-2xl font-bold text-gray-100">{t[currentPage.toLowerCase().replace(/ /g, '')] || currentPage}</h1>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg">
                           <Store size={16} className="text-gray-400"/>
                           <span className="font-bold text-white">{t.store}: {selectedStore}</span>
                        </div>
                        <WeekNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} currentWeek={currentWeek} language={language} />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
                    {renderPage()}
                </div>
            </main>
            {passcodeChallenge?.type === 'payroll' && <PasscodeModal correctPasscode="9160" onSuccess={handlePasscodeSuccess} onClose={() => setPasscodeChallenge(null)} t={t} />}
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </div>
    );
}
