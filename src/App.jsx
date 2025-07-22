import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, query, where, writeBatch, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Users, DollarSign, Clock, BarChart2, FileText, PlusCircle, Trash2, Save, TrendingUp, ChevronDown, ChevronUp, ClipboardList, ShoppingCart, Gift, UserCheck, Store, Shield, RefreshCw, LogOut, Target, X, Award, Percent, Hash, ChevronLeft, ChevronRight, UserCog, CheckCircle, UserPlus } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBHbryV3zYF2-J00mift241A_sUBRtKSl4",
  authDomain: "rudsak-sales-payroll-tra-2c94b.firebaseapp.com",
  projectId: "rudsak-sales-payroll-tra-2c94b",
  storageBucket: "rudsak-sales-payroll-tra-2c94b.appspot.com",
  messagingSenderId: "261701010314",
  appId: "1:261701010314:web:834be29dc22a5f6aa03e73"
};
// A unique identifier for this application instance in Firestore.
const appId = 'rudsak-sales-payroll-app';

// --- Firebase Initialization ---
let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// --- Translation Dictionary ---
const translations = {
    en: {
        dashboard: 'Dashboard',
        performanceGoals: 'Performance Goals',
        dailyPlanner: 'Daily Planner',
        schedule: 'Schedule',
        payroll: 'Payroll',
        dailySalesLog: 'Daily Sales Log',
        stc: 'STC',
        reports: 'Reports',
        changeStore: 'Change Store',
        currentWeek: 'Current Week',
        store: 'Store',
        totalWeeklySales: 'Total Weekly Sales',
        totalTransactions: 'Total Transactions',
        totalHoursLogged: 'Total Hours Logged',
        salesByDay: 'Sales by Day',
        salesByCategory: 'Sales by Category',
        whosOnShift: "Who's On Shift Today?",
        noOneScheduled: 'No one is scheduled to work today.',
        enterPasscode: 'Enter Passcode',
        sectionRestricted: 'This section is restricted.',
        cancel: 'Cancel',
        unlock: 'Unlock',
        weeklyStoreGoals: 'Weekly Store Goals',
        weeklySalesTarget: 'Weekly Sales Target',
        dailyStoreGoals: 'Daily Store Goals',
        kpiTargets: 'KPI Targets',
        dollarsPerHour: 'Dollars Per Hour ($/Hr)',
        dollarsPerTransaction: 'Avg. Transaction Value',
        unitsPerTransaction: 'Units Per Transaction',
        saveGoals: 'Save Goals',
        todaysGoal: "Today's Goal",
        weeklyGoal: "Weekly Goal",
        achieved: "Achieved",
        conversionRate: 'Conversion Rate',
        topSellers: 'Top Sellers',
        admin: 'Admin',
        employeeDatabase: 'Employee Database',
        exit: 'Exit',
        saveChanges: 'Save Changes',
        payrollName: 'Payroll Name',
        positionId: 'Position ID',
        jobTitleDescription: 'Job Title Description',
        rate: 'Rate ($/hr)',
        baseSalary: 'Base Salary ($/yr)',
        associatedStore: 'Associated Store',
        actions: 'Actions',
        addNewEmployee: 'Add New Employee',
        addEmployee: 'Add Employee',
        fillAllFields: 'Please fill out all fields.',
        employeeAddedSuccess: 'Employee added successfully!',
        errorAddingEmployee: 'Error adding employee.',
        errorSavingChanges: 'Error saving changes.',
        employeeDeleted: 'Employee deleted.',
        errorDeletingEmployee: 'Error deleting employee.',
        goalsSavedSuccess: 'Goals saved successfully!',
        errorSavingGoals: 'Error saving goals.',
        payrollDataSavedSuccess: 'Payroll data saved successfully!',
        errorSavingPayroll: 'Error saving payroll data.',
        scheduleSavedSuccess: 'Schedule saved successfully!',
        errorSavingSchedule: 'Error saving schedule.',
        stcDataSavedSuccess: 'STC data saved successfully!',
        errorSavingStc: 'Error saving STC data.',
        plannerSaved: 'Planner saved!',
        errorSavingPlanner: 'Error saving planner.',
        selectStoreLocation: "Select Your Store Location",
        salesTrackerTitle: "Rudsak Sales Tracker",
        saveSchedule: "Save Schedule",
        invoiceNum: "Invoice #",
        type: "Type",
        salesRep: "Sales Rep",
        items: "Items",
        total: "Total",
        payment: "Payment",
        noSalesForDay: "No sales recorded for {day}.",
        itemsInTransaction: "Items in Transaction #{invoice}",
        note: "Note: {notes}",
        description: "Description",
        category: "Category",
        qty: "Qty",
        price: "Price",
        subtotal: "Subtotal",
        addItem: "Add Item",
        saveTransaction: "Save Transaction",
        originalStore: "Original Store",
        originalSalesPerson: "Original Sales Person",
        originalEmployeeId: "Original Employee ID",
        returnReason: "Notes (Reason for return, etc.)",
        processReturn: "Process Return",
        amount: "Amount",
        employeeId: "Employee ID",
        employeeName: "Employee Name",
        salesObjective: "Sales Objective $",
        totalSchedHrs: "Total Sched. Hrs",
        totalActualHrs: "Total Actual Hrs",
        shift: "Shift",
        sched: "Sched.",
        actual: "Actual",
        enterName: "Enter name",
        addToSchedule: "Add to Schedule",
        dailySalesObjectivesFor: "Daily Sales Objectives for {name}",
        done: "Done",
        hour: "Hour",
        footTraffic: "Foot Traffic",
        transactions: "Transactions",
        employees: "Employees",
        conversion: "Conversion %",
        savePayroll: "Save Payroll",
        totals: "Totals",
        currentWeekPerformance: "Current Week Performance Metrics",
        netSales: "Net Sales",
        totalReturns: "Total Returns",
        giftCardsSold: "Gift Cards Sold",
        avgDollarValue: "Avg. Dollar Value",
        upt: "Units Per Transaction",
        weeklyTrendAnalysis: "Weekly Trend Analysis",
        currentWeekSellersAnalysis: "Current Week Sellers Analysis",
        seller: "Seller",
        objective: "Objective",
        differential: "+/-",
        percent: "%",
        numTrans: "# Trans",
        units: "Units",
        hrs: "Hrs",
        dph: "$/Hr",
        dpt: "$/Trans",
        confirmSave: "Confirm Save",
        confirmSaveEmployeeDb: "Are you sure you want to save all changes to the employee database?",
        confirmSaveGoals: "Confirm Save Goals",
        confirmSaveGoalsMsg: "Are you sure you want to save these performance goals?",
        confirmSaveSchedule: "Confirm Save Schedule",
        confirmSaveScheduleMsg: "Are you sure you want to save the changes to this week's schedule?",
        confirmSaveStc: "Confirm Save STC Data",
        confirmSaveStcMsg: "Are you sure you want to save the STC data for {day}?",
        confirmSavePayroll: "Confirm Save Payroll",
        confirmSavePayrollMsg: "Are you sure you want to save the payroll data for this week?",
        confirmAndSave: "Confirm & Save",
        plannerForDate: "Daily Planner for {date}",
        savePlanner: "Save Planner",
        dailyNotes: "Daily Notes",
        generalNotesPlaceholder: "General notes for the day...",
        topPriorities: "Top Priorities",
        addPriority: "Add Priority",
        taskList: "Task List",
        taskDescriptionPlaceholder: "Task description...",
        unassigned: "Unassigned",
        addTask: "Add Task",
        soldBy: "Sold By",
        salesContributionByCategory: 'Sales Contribution by Category',
        Outerwear: 'Outerwear',
        Footwear: 'Footwear',
        Handbags: 'Handbags',
        Accessories: 'Accessories',
        Clothing: 'Clothing',
        CP: 'CP',
        addGuestEmployee: 'Add Guest Employee',
        searchEmployee: 'Search for an employee...',
        workLocations: 'Work Locations',
        transfersIn: 'Transfers In',
        homeStore: 'Home Store',
        earnings: 'Earnings',
        commission: 'Commission $',
        totalWages: 'Total Wages',
    },
    fr: {
        dashboard: 'Tableau de Bord',
        performanceGoals: 'Objectifs de Performance',
        dailyPlanner: 'Planificateur Quotidien',
        schedule: 'Horaire',
        payroll: 'Paie',
        dailySalesLog: 'Journal des Ventes',
        stc: 'VTC',
        reports: 'Rapports',
        changeStore: 'Changer de Magasin',
        currentWeek: 'Semaine Actuelle',
        store: 'Magasin',
        totalWeeklySales: 'Ventes Hebdomadaires Totales',
        totalTransactions: 'Transactions Totales',
        totalHoursLogged: 'Heures Totales Enregistrées',
        salesByDay: 'Ventes par Jour',
        salesByCategory: 'Ventes par Catégorie',
        whosOnShift: "Qui Travaille Aujourd'hui?",
        noOneScheduled: "Personne n'est prévu pour travailler aujourd'hui.",
        enterPasscode: 'Entrez le mot de passe',
        sectionRestricted: 'Cette section est restreinte.',
        cancel: 'Annuler',
        unlock: 'Déverrouiller',
        weeklyStoreGoals: 'Objectifs Hebdomadaires du Magasin',
        weeklySalesTarget: 'Objectif de Ventes Hebdomadaire',
        dailyStoreGoals: 'Objectifs Quotidiens du Magasin',
        kpiTargets: 'Cibles KPI',
        dollarsPerHour: 'Dollars par Heure ($/Hr)',
        dollarsPerTransaction: 'Valeur Moy. par Transaction',
        unitsPerTransaction: 'Unités par Transaction',
        saveGoals: 'Enregistrer les Objectifs',
        todaysGoal: "Objectif d'aujourd'hui",
        weeklyGoal: 'Objectif de la semaine',
        achieved: 'Atteint',
        conversionRate: 'Taux de Conversion',
        topSellers: 'Meilleurs Vendeurs',
        admin: 'Admin',
        employeeDatabase: 'Base de Données des Employés',
        exit: 'Sortir',
        saveChanges: 'Enregistrer les modifications',
        payrollName: 'Nom (Paie)',
        positionId: 'ID de Position',
        jobTitleDescription: 'Titre du Poste',
        rate: 'Taux ($/hr)',
        baseSalary: 'Salaire de Base ($/an)',
        associatedStore: 'Magasin Associé',
        actions: 'Actions',
        addNewEmployee: 'Ajouter un Nouvel Employé',
        addEmployee: "Ajouter l'Employé",
        fillAllFields: 'Veuillez remplir tous les champs.',
        employeeAddedSuccess: 'Employé ajouté avec succès!',
        errorAddingEmployee: "Erreur lors de l'ajout de l'employé.",
        errorSavingChanges: "Erreur lors de l'enregistrement des modifications.",
        employeeDeleted: 'Employé supprimé.',
        errorDeletingEmployee: "Erreur lors de la suppression de l'employé.",
        goalsSavedSuccess: 'Objectifs enregistrés avec succès!',
        errorSavingGoals: "Erreur lors de l'enregistrement des objectifs.",
        payrollDataSavedSuccess: 'Données de paie enregistrées avec succès!',
        errorSavingPayroll: "Erreur lors de l'enregistrement des données de paie.",
        scheduleSavedSuccess: 'Horaire enregistré avec succès!',
        errorSavingSchedule: "Erreur lors de l'enregistrement de l'horaire.",
        stcDataSavedSuccess: 'Données VTC enregistrées avec succès!',
        errorSavingStc: "Erreur lors de l'enregistrement des données VTC.",
        plannerSaved: 'Planificateur enregistré!',
        errorSavingPlanner: "Erreur lors de l'enregistrement du planificateur.",
        selectStoreLocation: "Sélectionnez l'emplacement de votre magasin",
        salesTrackerTitle: "Suivi des Ventes Rudsak",
        saveSchedule: "Enregistrer l'Horaire",
        invoiceNum: "Facture #",
        type: "Type",
        salesRep: "Vendeur",
        items: "Articles",
        total: "Total",
        payment: "Paiement",
        noSalesForDay: "Aucune vente enregistrée pour {day}.",
        itemsInTransaction: "Articles dans la Transaction #{invoice}",
        note: "Note : {notes}",
        description: "Description",
        category: "Catégorie",
        qty: "Qté",
        price: "Prix",
        subtotal: "Sous-total",
        addItem: "Ajouter un Article",
        saveTransaction: "Enregistrer la Transaction",
        originalStore: "Magasin d'Origine",
        originalSalesPerson: "Vendeur d'Origine",
        originalEmployeeId: "ID Employé d'Origine",
        returnReason: "Notes (Raison du retour, etc.)",
        processReturn: "Traiter le Retour",
        amount: "Montant",
        employeeId: "ID Employé",
        employeeName: "Nom de l'Employé",
        salesObjective: "Objectif de Vente $",
        totalSchedHrs: "Total Hres Prévues",
        totalActualHrs: "Total Hres Réelles",
        shift: "Quart",
        sched: "Prévu",
        actual: "Réel",
        enterName: "Entrer le nom",
        addToSchedule: "Ajouter à l'Horaire",
        dailySalesObjectivesFor: "Objectifs de Vente Quotidiens pour {name}",
        done: "Terminé",
        hour: "Heure",
        footTraffic: "Achalandage",
        transactions: "Transactions",
        employees: "Employés",
        conversion: "Conversion %",
        savePayroll: "Enregistrer la Paie",
        totals: "Totaux",
        currentWeekPerformance: "Indicateurs de Performance de la Semaine",
        netSales: "Ventes Nettes",
        totalReturns: "Retours Totaux",
        giftCardsSold: "Cartes-Cadeaux Vendues",
        avgDollarValue: "Valeur Moy. par Trans.",
        upt: "Unités par Transaction",
        weeklyTrendAnalysis: "Analyse des Tendances Hebdomadaires",
        currentWeekSellersAnalysis: "Analyse des Vendeurs de la Semaine",
        seller: "Vendeur",
        objective: "Objectif",
        differential: "+/-",
        percent: "%",
        numTrans: "# Trans",
        units: "Unités",
        hrs: "Hres",
        dph: "$/Hre",
        dpt: "$/Trans",
        confirmSave: "Confirmer l'enregistrement",
        confirmSaveEmployeeDb: "Êtes-vous sûr de vouloir enregistrer toutes les modifications dans la base de données des employés?",
        confirmSaveGoals: "Confirmer l'enregistrement des objectifs",
        confirmSaveGoalsMsg: "Êtes-vous sûr de vouloir enregistrer ces objectifs de performance?",
        confirmSaveSchedule: "Confirmer l'enregistrement de l'horaire",
        confirmSaveScheduleMsg: "Êtes-vous sûr de vouloir enregistrer les modifications de l'horaire de cette semaine?",
        confirmSaveStc: "Confirmer l'enregistrement des données VTC",
        confirmSaveStcMsg: "Êtes-vous sûr de vouloir enregistrer les données VTC pour {day}?",
        confirmSavePayroll: "Confirmer l'enregistrement de la paie",
        confirmSavePayrollMsg: "Êtes-vous sûr de vouloir enregistrer les données de paie pour cette semaine?",
        confirmAndSave: "Confirmer et Enregistrer",
        plannerForDate: "Planificateur Quotidien pour le {date}",
        savePlanner: "Enregistrer le Planificateur",
        dailyNotes: "Notes Quotidiennes",
        generalNotesPlaceholder: "Notes générales pour la journée...",
        topPriorities: "Priorités Principales",
        addPriority: "Ajouter une Priorité",
        taskList: "Liste de Tâches",
        taskDescriptionPlaceholder: "Description de la tâche...",
        unassigned: "Non assigné",
        addTask: "Ajouter une Tâche",
        soldBy: "Vendu par",
        salesContributionByCategory: 'Contribution des Ventes par Catégorie',
        Outerwear: 'Manteaux',
        Footwear: 'Chaussures',
        Handbags: 'Sacs à main',
        Accessories: 'Accessoires',
        Clothing: 'Vêtements',
        CP: 'PC',
        addGuestEmployee: 'Ajouter un Employé Invité',
        searchEmployee: 'Rechercher un employé...',
        workLocations: 'Lieux de Travail',
        transfersIn: 'Transferts Entrants',
        homeStore: 'Magasin Principal',
        earnings: 'Gains',
        commission: 'Commission $',
        totalWages: 'Salaires Totaux',
    }
};


// --- Helper Functions & Constants ---
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_OF_WEEK_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const PAYMENT_METHODS = ['Cash', 'Credit', 'Debit', 'Amex', 'GC', 'Check'];
const SALE_CATEGORIES = ["Outerwear", "Footwear", "Handbags", "Accessories", "Clothing", "CP"];
const JOB_TITLES = ["Manager", "Co-Manager", "Asst. Manager", "3rd Key", "Sales Associate", "Cashier", "Stock Clerk", "Runner", "Greeter"];
const OPERATING_HOURS = Array.from({ length: 13 }, (_, i) => `${i + 9}:00`); // 9:00 to 21:00
const TRANSACTION_TYPES = {
    REGULAR: 'Regular Sale',
    EMPLOYEE: 'Employee Purchase',
    GIFT_CARD: 'Gift Card Purchase',
    RETURN: 'Return'
};
const FRENCH_STORES = ['0001', '0002', '0003', '0004', '0006', '0008', '0009', '0010', '0019', '0020', '0023', '0025', '0035'];
const ENGLISH_STORES = ['0021', '0026', '0028', '0029', '0031', '0039', '0101', '0104', '0106', '0107'];
const ALL_STORES = [...FRENCH_STORES, ...ENGLISH_STORES].sort();

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#8884d8'];

const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '$0.00';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getWeekNumber = (d) => {
    const date = new Date(d.valueOf());
    date.setHours(0, 0, 0, 0);
    // Sunday is the first day of the week.
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    // Get the day of the week of the first day of the year (0=Sun, 1=Mon,...)
    const firstDayOfWeek = firstDayOfYear.getDay();
    // Calculate the number of days that have passed since the beginning of the year
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    // Calculate the week number
    return Math.ceil((pastDaysOfYear + firstDayOfWeek + 1) / 7);
};

const parseShift = (shift) => {
    if (!shift || typeof shift !== 'string' || shift.toLowerCase() === 'off' || shift.toLowerCase() === 'o') {
        return 0;
    }

    const parts = shift.split(/[\-–]/);
    if (parts.length !== 2) return 0;

    const parseTime = (timeStr) => {
        const originalTimeStr = timeStr.trim();
        const isPm = originalTimeStr.toLowerCase().includes('pm');
        const isAm = originalTimeStr.toLowerCase().includes('am');

        let numericStr = originalTimeStr.replace(/am|pm/gi, '').trim();
        let [hours, minutes] = numericStr.split(':').map(Number);
        minutes = minutes || 0;

        if (isNaN(hours)) return null;

        if (isPm && hours < 12) {
            hours += 12;
        }
        if (isAm && hours === 12) { // Handle 12am (midnight)
            hours = 0;
        }

        return hours + minutes / 60;
    };

    let startTime = parseTime(parts[0]);
    let endTime = parseTime(parts[1]);

    if (startTime === null || endTime === null) return 0;

    // Handle cases like "9-5" where PM is implied for the end time
    if (!parts[0].toLowerCase().match(/am|pm/) && !parts[1].toLowerCase().match(/am|pm/)) {
       if (endTime <= startTime && endTime < 12) {
           endTime += 12;
       }
       // Handle cases like "1-9" where both are likely PM
       if (startTime < 7 && endTime > startTime) {
           startTime += 12;
           endTime += 12;
       }
    }


    let duration = endTime - startTime;

    // Handle overnight shifts
    if (duration < 0) {
        duration += 24;
    }
    
    // Automatically deduct 1 hour for breaks on shifts longer than 5 hours
    if (duration > 5) {
        duration -= 1;
    }

    return duration > 0 ? duration : 0;
};

// --- Reusable UI Components ---

const SaveButton = ({ onClick, saveState, text = 'Save' }) => {
    const stateConfig = {
        idle: { text: text, icon: <Save size={18} className="mr-2" />, color: 'bg-blue-600 hover:bg-blue-700', disabled: false },
        saving: { text: 'Saving...', icon: <RefreshCw size={18} className="mr-2 animate-spin" />, color: 'bg-blue-500', disabled: true },
        saved: { text: 'Saved!', icon: <CheckCircle size={18} className="mr-2" />, color: 'bg-green-600', disabled: true },
    };

    const current = stateConfig[saveState] || stateConfig.idle;

    return (
        <button
            onClick={onClick}
            disabled={current.disabled}
            className={`flex items-center justify-center text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 ${current.color}`}
        >
            {current.icon}
            {current.text}
        </button>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, t }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md text-center">
                <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
                <div className="text-gray-300 mb-6">
                    {children}
                </div>
                <div className="flex space-x-4 justify-center">
                    <button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        {t.cancel}
                    </button>
                    <button onClick={onConfirm} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        {t.confirmAndSave}
                    </button>
                </div>
            </div>
        </div>
    );
};

const WeekNavigator = ({ currentDate, setCurrentDate, currentWeek, language }) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };
    
    const options = { month: 'short', day: 'numeric' };
    const locale = language === 'fr' ? 'fr-CA' : 'en-US';

    return (
        <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg">
            <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-600 rounded-full"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-white whitespace-nowrap">
                {language === 'fr' ? 'Semaine' : 'Week'} {currentWeek}: {startOfWeek.toLocaleDateString(locale, options)} - {endOfWeek.toLocaleDateString(locale, options)}, {currentDate.getFullYear()}
            </span>
            <button onClick={handleNextWeek} className="p-1 hover:bg-gray-600 rounded-full"><ChevronRight size={16} /></button>
        </div>
    );
};


// --- Admin Page Component ---
const AdminPage = ({ onExit, t, db, appId, setNotification }) => {
    const [employees, setEmployees] = useState([]);
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        positionId: '',
        jobTitle: JOB_TITLES[0],
        rate: 0,
        baseSalary: 0,
        associatedStore: ALL_STORES[0],
    });
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        if (!db) return;
        const employeesCollectionRef = collection(db, `artifacts/${appId}/public/data/employees`);
        const unsubscribe = onSnapshot(employeesCollectionRef, (snapshot) => {
            setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => console.error("Error fetching employees:", err));

        return () => unsubscribe();
    }, [db, appId]);

    const handleNewEmployeeChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({ ...prev, [name]: value }));
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (!db || !newEmployee.name || !newEmployee.positionId) {
            setNotification({ message: t.fillAllFields, type: 'error' });
            return;
        }
        try {
            const employeesCollectionRef = collection(db, `artifacts/${appId}/public/data/employees`);
            await addDoc(employeesCollectionRef, {
                ...newEmployee,
                rate: Number(newEmployee.rate),
                baseSalary: Number(newEmployee.baseSalary)
            });
            setNewEmployee({
                name: '',
                positionId: '',
                jobTitle: JOB_TITLES[0],
                rate: 0,
                baseSalary: 0,
                associatedStore: ALL_STORES[0],
            });
            setNotification({ message: t.employeeAddedSuccess, type: 'success' });
        } catch (error) {
            console.error("Error adding employee:", error);
            setNotification({ message: t.errorAddingEmployee, type: 'error' });
        }
    };

    const handleEmployeeChange = (id, field, value) => {
        setEmployees(current => current.map(emp => {
            if (emp.id === id) {
                return { ...emp, [field]: value };
            }
            return emp;
        }));
    };

    const executeSaveChanges = async () => {
        if (!db) return;
        setSaveStatus('saving');
        const batch = writeBatch(db);
        employees.forEach(emp => {
            const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.id);
            const { id, ...data } = emp; // Exclude id from the data being written
            batch.set(docRef, data, { merge: true });
        });
        try {
            await batch.commit();
            setSaveStatus('saved');
            setNotification({ message: t.employeeDataSaved, type: 'success' });
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Error saving changes:", error);
            setNotification({ message: t.errorSavingChanges, type: 'error' });
            setSaveStatus('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSaveChanges();
    };
    
    const handleDeleteEmployee = async (id) => {
         if (!db) return;
         try {
             await deleteDoc(doc(db, `artifacts/${appId}/public/data/employees`, id));
             setNotification({ message: t.employeeDeleted, type: 'success' });
         } catch (error) {
             console.error("Error deleting employee:", error);
             setNotification({ message: t.errorDeletingEmployee, type: 'error' });
         }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8 font-sans">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <Users className="mr-3" />
                    {t.employeeDatabase}
                </h1>
                <button onClick={onExit} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    <LogOut size={18} className="mr-2" />
                    {t.exit}
                </button>
            </header>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-end mb-4">
                     <SaveButton onClick={handleSaveClick} saveState={saveStatus} text={t.saveChanges} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">{t.payrollName}</th>
                                <th className="px-4 py-3">{t.positionId}</th>
                                <th className="px-4 py-3">{t.jobTitleDescription}</th>
                                <th className="px-4 py-3">{t.rate}</th>
                                <th className="px-4 py-3">{t.baseSalary}</th>
                                <th className="px-4 py-3">{t.associatedStore}</th>
                                <th className="px-4 py-3">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-2"><input type="text" value={emp.name} onChange={e => handleEmployeeChange(emp.id, 'name', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><input type="text" value={emp.positionId} onChange={e => handleEmployeeChange(emp.id, 'positionId', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2">
                                        <select value={emp.jobTitle} onChange={e => handleEmployeeChange(emp.id, 'jobTitle', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1">
                                            {JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-2"><input type="number" value={emp.rate} onChange={e => handleEmployeeChange(emp.id, 'rate', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2"><input type="number" value={emp.baseSalary} onChange={e => handleEmployeeChange(emp.id, 'baseSalary', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1" /></td>
                                    <td className="px-4 py-2">
                                        <select value={emp.associatedStore} onChange={e => handleEmployeeChange(emp.id, 'associatedStore', e.target.value)} className="w-full bg-transparent focus:bg-gray-900 outline-none rounded px-2 py-1">
                                            {ALL_STORES.map(store => <option key={store} value={store}>{store}</option>)}
                                        </select>
                                    </td>
                                     <td className="px-4 py-2">
                                        <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-8 border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold mb-4">{t.addNewEmployee}</h3>
                    <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <input type="text" name="name" placeholder={t.payrollName} value={newEmployee.name} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                        <input type="text" name="positionId" placeholder={t.positionId} value={newEmployee.positionId} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                        <select name="jobTitle" value={newEmployee.jobTitle} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                             {JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                        </select>
                         <select name="associatedStore" value={newEmployee.associatedStore} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2">
                             {ALL_STORES.map(store => <option key={store} value={store}>{store}</option>)}
                        </select>
                        <input type="number" name="rate" placeholder={t.rate} value={newEmployee.rate} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        <input type="number" name="baseSalary" placeholder={t.baseSalary} value={newEmployee.baseSalary} onChange={handleNewEmployeeChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        <button type="submit" className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg col-span-full md:col-span-1 lg:col-span-2">
                            <PlusCircle size={18} className="mr-2" />
                            {t.addEmployee}
                        </button>
                    </form>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSave}
                t={t}
            >
                <p>{t.confirmSaveEmployeeDb}</p>
            </ConfirmationModal>
        </div>
    );
};

const StoreSelector = ({ onSelectStore, onAdminClick, language, setLanguage, t }) => {
    const storesToShow = language === 'fr' ? FRENCH_STORES : ENGLISH_STORES;
    
    return (
        <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
            <div className="absolute top-4 right-4 flex items-center">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-l-md text-sm font-bold ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>EN</button>
                <button onClick={() => setLanguage('fr')} className={`px-3 py-1 rounded-r-md text-sm font-bold ${language === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>FR</button>
            </div>
            <div className="absolute top-4 left-4">
                <button onClick={onAdminClick} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    <UserCog size={18} className="mr-2" />
                    {t.admin}
                </button>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{t.salesTrackerTitle}</h1>
            <h2 className="text-2xl font-light text-gray-300 mb-8">{t.selectStoreLocation}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-4xl">
                {storesToShow.map(store => (
                    <button key={store} onClick={() => onSelectStore(store)} className="bg-gray-800 text-white font-bold text-lg p-6 rounded-lg shadow-lg hover:bg-blue-600 hover:scale-105 transition-transform duration-200">
                        {store}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Sidebar Component ---
const Sidebar = ({ currentPage, onNavClick, onChangeStore, t }) => {
    const navItems = [
        { name: 'Dashboard', key: 'dashboard', icon: BarChart2 },
        { name: 'Performance Goals', key: 'performanceGoals', icon: Target },
        { name: 'Daily Planner', key: 'dailyPlanner', icon: ClipboardList },
        { name: 'Schedule', key: 'schedule', icon: Calendar },
        { name: 'Payroll', key: 'payroll', icon: FileText },
        { name: 'Daily Sales Log', key: 'dailySalesLog', icon: DollarSign },
        { name: 'STC', key: 'stc', icon: TrendingUp },
        { name: 'Reports', key: 'reports', icon: Users },
    ];
    return (
        <nav className="w-64 bg-gray-800/50 p-4 flex flex-col">
            <div>
                <div className="text-white text-xl font-bold mb-10 flex items-center space-x-2">
                    <span>{t.salesTrackerTitle}</span>
                </div>
                <ul>
                    {navItems.map(item => (
                        <li key={item.name} className="mb-2">
                            <a href="#" onClick={() => onNavClick(item.name)}
                               className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${currentPage === item.name ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                                <item.icon className="mr-3" size={20} />
                                <span>{t[item.key]}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto">
                 <button onClick={onChangeStore} className="flex w-full items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200">
                    <LogOut className="mr-3" size={20} />
                    <span>{t.changeStore}</span>
                </button>
            </div>
        </nav>
    );
};

const PasscodeModal = ({ correctPasscode, onSuccess, onClose, t }) => {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (passcode === correctPasscode) {
            onSuccess();
        } else {
            setError(true);
            setPasscode('');
            setTimeout(() => setError(false), 1000);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`bg-gray-800 p-8 rounded-lg shadow-2xl text-center border border-gray-700 transition-transform duration-300 ${error ? 'animate-shake' : ''}`}>
                <Shield size={48} className="mx-auto text-blue-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">{t.enterPasscode}</h2>
                <p className="text-gray-400 mb-6">{t.sectionRestricted}</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className={`w-full text-center text-2xl tracking-widest bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-md px-4 py-2 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        maxLength="4"
                    />
                    <div className="flex space-x-4">
                        <button type="button" onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">{t.cancel}</button>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.unlock}</button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake {
                    animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
};

const Notification = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed bottom-5 right-5 text-white px-6 py-4 rounded-lg shadow-lg z-50 ${bgColor}`}>
            {message}
        </div>
    );
};

// --- Page Components ---

const Dashboard = ({ sales, schedule, performanceGoals, stcData, t }) => {
    const { netSales, avgTransactionValue, unitsPerTransaction, conversionRate, leaderboardData, categorySalesData } = useMemo(() => {
        let totalNetSales = 0;
        const employeeSalesMap = new Map();
        const categoryTotals = {};

        sales.forEach(sale => {
            if (sale.type === TRANSACTION_TYPES.GIFT_CARD) return;
            totalNetSales += sale.total;
            (sale.items || []).forEach(item => {
                const rep = item.salesRep;
                const itemValue = Number(item.total || (item.price * item.quantity) || 0);
                if(rep) {
                    employeeSalesMap.set(rep, (employeeSalesMap.get(rep) || 0) + itemValue);
                }
                if (sale.type !== TRANSACTION_TYPES.RETURN) {
                    if (!categoryTotals[item.category]) categoryTotals[item.category] = 0;
                    categoryTotals[item.category] += itemValue;
                }
            });
        });
        
        const merchandiseSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD && s.type !== TRANSACTION_TYPES.RETURN);
        const totalTransactions = merchandiseSales.length;
        const totalUnits = merchandiseSales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);
        
        const totalTraffic = Object.values(stcData.days || {}).reduce((daySum, dayData) => {
            return daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.traffic || 0), 0);
        }, 0);
        
        const totalSTCTransactions = Object.values(stcData.days || {}).reduce((daySum, dayData) => {
            return daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.transactions || 0), 0);
        }, 0);

        const leaderboard = Array.from(employeeSalesMap.entries())
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3);
            
        const categorySales = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0)
            .sort((a,b) => b.value - a.value);

        return {
            netSales: totalNetSales,
            avgTransactionValue: totalTransactions > 0 ? totalNetSales / totalTransactions : 0,
            unitsPerTransaction: totalTransactions > 0 ? totalUnits / totalTransactions : 0,
            conversionRate: totalTraffic > 0 ? (totalSTCTransactions / totalTraffic) * 100 : 0,
            leaderboardData: leaderboard,
            categorySalesData: categorySales
        };
    }, [sales, stcData]);
    
    const todayString = DAYS_OF_WEEK[new Date().getDay()];
    const dailyTarget = performanceGoals.daily?.[todayString.toLowerCase()] || 0;
    const dailyActual = sales.filter(s => s.day === todayString && s.type !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.total, 0);
    const dailyPercent = dailyTarget > 0 ? (dailyActual / dailyTarget) * 100 : 0;

    const weeklyTarget = performanceGoals.weeklySalesTarget || 0;
    const weeklyPercent = weeklyTarget > 0 ? (netSales / weeklyTarget) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <GoalProgressCard title={t.todaysGoal} actual={dailyActual} target={dailyTarget} percent={dailyPercent} />
                <GoalProgressCard title={t.weeklyGoal} actual={netSales} target={weeklyTarget} percent={weeklyPercent} />
                <KPIStatCard title={t.conversionRate} value={`${conversionRate.toFixed(2)}%`} icon={Percent} color="purple" />
                <KPIStatCard title={t.dollarsPerTransaction} value={formatCurrency(avgTransactionValue)} icon={DollarSign} color="blue" />
                <KPIStatCard title={t.unitsPerTransaction} value={unitsPerTransaction.toFixed(2)} icon={Hash} color="orange" />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                     <h3 className="text-lg font-semibold mb-4 text-gray-200">{t.topSellers}</h3>
                     <div className="space-y-4">
                         {leaderboardData.map((seller, index) => (
                             <div key={seller.name} className="flex items-center">
                                 <Award size={24} className={index === 0 ? 'text-yellow-400' : (index === 1 ? 'text-gray-400' : 'text-yellow-600')} />
                                 <div className="ml-4 flex-grow">
                                     <p className="font-bold text-white">{seller.name}</p>
                                     <p className="text-sm text-gray-400">{formatCurrency(seller.sales)}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-200">{t.salesByCategory}</h3>
                    <div className="space-y-3 pr-2 max-h-52 overflow-y-auto">
                        {categorySalesData.map((cat, index) => (
                            <div key={cat.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    <span className="text-gray-300">{t[cat.name] || cat.name}</span>
                                </div>
                                <span className="font-bold text-white">{formatCurrency(cat.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GoalProgressCard = ({ title, actual, target, percent }) => {
    const progress = Math.min(percent, 100);
    const strokeColor = progress >= 100 ? '#48BB78' : (progress > 50 ? '#4299E1' : '#F56565');
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">{title}</h3>
            <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-700" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                        className="transition-all duration-500"
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeDasharray={`${progress}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{percent.toFixed(0)}%</span>
                </div>
            </div>
            <div className="text-center mt-4">
                <p className="text-2xl font-bold text-white">{formatCurrency(actual)}</p>
                <p className="text-sm text-gray-400">/ {formatCurrency(target)}</p>
            </div>
        </div>
    );
};

const KPIStatCard = ({ title, value, icon: Icon, color }) => {
    const colors = {
        purple: 'text-purple-400',
        blue: 'text-blue-400',
        orange: 'text-orange-400',
    };
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-start justify-between">
                <p className="text-sm text-gray-400">{title}</p>
                <Icon size={20} className={colors[color]} />
            </div>
            <p className="text-4xl font-bold text-white mt-2">{value}</p>
        </div>
    );
};

const PerformanceGoals = ({ performanceGoals, currentWeek, currentYear, db, appId, selectedStore, t, setNotification, language }) => {
    const [goals, setGoals] = useState({ daily: {}, kpi: {} });
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        setGoals(performanceGoals || { daily: {}, kpi: {} });
    }, [performanceGoals]);

    const handleKpiChange = (e) => {
        const { name, value } = e.target;
        setGoals(prev => ({ ...prev, kpi: { ...prev.kpi, [name]: Number(value) } }));
    };

    const handleDailyChange = (day, value) => {
        setGoals(prev => {
            const newDailyGoals = {
                ...prev.daily,
                [day]: Number(value) || 0
            };
            const newWeeklyTarget = Object.values(newDailyGoals).reduce((sum, val) => sum + val, 0);
            return {
                ...prev,
                daily: newDailyGoals,
                weeklySalesTarget: newWeeklyTarget
            };
        });
    };

    const executeSave = async () => {
        if (!db) return;
        setSaveState('saving');
        const docId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/performance_goals`, docId);
        try {
            await setDoc(docRef, { ...goals, storeId: selectedStore, week: currentWeek, year: currentYear }, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.goalsSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving goals:", error);
            setNotification({ message: t.errorSavingGoals, type: 'error' });
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSave();
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-8">
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyStoreGoals}</h2>
                    <div className="flex items-center space-x-4">
                        <label htmlFor="weeklySalesTarget" className="text-gray-300">{t.weeklySalesTarget}:</label>
                        <input type="number" id="weeklySalesTarget" value={goals.weeklySalesTarget || ''} readOnly className="w-48 bg-gray-700 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">{t.dailyStoreGoals}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {weekDays.map((day, index) => (
                            <div key={day}>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{day}</label>
                                <input type="number" value={goals.daily?.[DAYS_OF_WEEK[index].toLowerCase()] || ''} onChange={e => handleDailyChange(DAYS_OF_WEEK[index].toLowerCase(), e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">{t.kpiTargets}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col">
                            <label htmlFor="dph" className="text-gray-300 mb-1">{t.dollarsPerHour}</label>
                            <input type="number" name="dph" id="dph" value={goals.kpi?.dph || ''} onChange={handleKpiChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="dpt" className="text-gray-300 mb-1">{t.dollarsPerTransaction}</label>
                            <input type="number" name="dpt" id="dpt" value={goals.kpi?.dpt || ''} onChange={handleKpiChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="upt" className="text-gray-300 mb-1">{t.unitsPerTransaction}</label>
                            <input type="number" name="upt" id="upt" value={goals.kpi?.upt || ''} onChange={handleKpiChange} className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2" step="0.01" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.saveGoals} />
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSaveGoals}
                t={t}
            >
                <p>{t.confirmSaveGoalsMsg}</p>
            </ConfirmationModal>
        </>
    );
};

const DailyPlanner = ({ dailyPlanner, schedule, db, appId, selectedStore, currentDate, setNotification, t }) => {
    const [plannerData, setPlannerData] = useState({ notes: '', priorities: [], tasks: [] });
    const [saveState, setSaveState] = useState('idle');

    useEffect(() => {
        if (dailyPlanner) {
            setPlannerData({
                notes: dailyPlanner.notes || '',
                priorities: dailyPlanner.priorities || [],
                tasks: dailyPlanner.tasks || [],
            });
        }
    }, [dailyPlanner]);

    const handlePlannerChange = (field, value) => {
        setPlannerData(prev => ({ ...prev, [field]: value }));
    };

    const handlePriorityChange = (id, field, value) => {
        const newPriorities = plannerData.priorities.map(p => p.id === id ? { ...p, [field]: value } : p);
        handlePlannerChange('priorities', newPriorities);
    };

    const handleTaskChange = (id, field, value) => {
        const newTasks = plannerData.tasks.map(t => t.id === id ? { ...t, [field]: value } : t);
        handlePlannerChange('tasks', newTasks);
    };

    const addPriority = () => {
        const newPriority = { id: crypto.randomUUID(), text: '', completed: false };
        handlePlannerChange('priorities', [...plannerData.priorities, newPriority]);
    };

    const addTask = () => {
        const newTask = { id: crypto.randomUUID(), text: '', assignedTo: '', completed: false };
        handlePlannerChange('tasks', [...plannerData.tasks, newTask]);
    };

    const deletePriority = (id) => {
        handlePlannerChange('priorities', plannerData.priorities.filter(p => p.id !== id));
    };

    const deleteTask = (id) => {
        handlePlannerChange('tasks', plannerData.tasks.filter(t => t.id !== id));
    };

    const handleSave = async () => {
        if (!db) return;
        setSaveState('saving');
        const plannerDocId = `${selectedStore}-${currentDate.toISOString().split('T')[0]}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/planners`, plannerDocId);
        try {
            await setDoc(docRef, plannerData, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.plannerSaved, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving planner:", error);
            setNotification({ message: t.errorSavingPlanner, type: 'error' });
            setSaveState('idle');
        }
    };

    const employeesOnShift = schedule?.rows?.filter(r => r.name) || [];

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{t.plannerForDate.replace('{date}', currentDate.toLocaleDateString())}</h2>
                <SaveButton onClick={handleSave} saveState={saveState} text={t.savePlanner} />
            </div>

            {/* Daily Notes */}
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-200">{t.dailyNotes}</h3>
                <textarea
                    value={plannerData.notes}
                    onChange={(e) => handlePlannerChange('notes', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                    rows="4"
                    placeholder={t.generalNotesPlaceholder}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Priorities */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">{t.topPriorities}</h3>
                    <div className="space-y-2">
                        {plannerData.priorities.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={p.completed} onChange={(e) => handlePriorityChange(p.id, 'completed', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>
                                <input type="text" value={p.text} onChange={(e) => handlePriorityChange(p.id, 'text', e.target.value)} className={`flex-grow bg-transparent outline-none p-1 rounded ${p.completed ? 'line-through text-gray-500' : 'text-white'}`} />
                                <button onClick={() => deletePriority(p.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addPriority} className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300"><PlusCircle size={16} className="mr-1" /> {t.addPriority}</button>
                </div>

                {/* Task List */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">{t.taskList}</h3>
                    <div className="space-y-2">
                        {plannerData.tasks.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={t.completed} onChange={(e) => handleTaskChange(t.id, 'completed', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>
                                <input type="text" value={t.text} onChange={(e) => handleTaskChange(t.id, 'text', e.target.value)} className={`w-1/2 bg-transparent outline-none p-1 rounded ${t.completed ? 'line-through text-gray-500' : 'text-white'}`} placeholder={t.taskDescriptionPlaceholder}/>
                                <select value={t.assignedTo} onChange={(e) => handleTaskChange(t.id, 'assignedTo', e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-sm">
                                    <option value="">{t.unassigned}</option>
                                    {employeesOnShift.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                                </select>
                                <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addTask} className="mt-2 flex items-center text-sm text-blue-400 hover:text-blue-300"><PlusCircle size={16} className="mr-1" /> {t.addTask}</button>
                </div>
            </div>
        </div>
    );
};

const DailySalesLog = ({ sales, schedule, currentWeek, currentYear, db, appId, selectedStore, t, language }) => {
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
            // For cross-store returns, we create two entries
            if (newSaleData.type === TRANSACTION_TYPES.RETURN && newSaleData.originalStore && newSaleData.originalStore !== selectedStore) {
                const batch = writeBatch(db);

                // Entry for the processing store (current store)
                const processingStoreData = {
                    ...dataToSave,
                    storeId: selectedStore,
                    notes: `Return for store ${newSaleData.originalStore}. Original salesperson: ${newSaleData.originalSalesPerson} (${newSaleData.originalSalesPersonId})`
                };
                const processingDocRef = doc(salesCollectionRef);
                batch.set(processingDocRef, processingStoreData);

                // Entry for the originating store
                const originatingStoreData = {
                    ...dataToSave, // It already has week, year, day
                    storeId: newSaleData.originalStore, // Override storeId for this entry
                    notes: `Return processed at store ${selectedStore}.`
                };
                const originatingDocRef = doc(salesCollectionRef);
                batch.set(originatingDocRef, originatingStoreData);
                
                await batch.commit();

            } else {
                 // For regular sales, employee sales, gift cards, and same-store returns
                 await addDoc(salesCollectionRef, {...dataToSave, storeId: selectedStore});
            }
            setFormType(null);
        } catch (error) {
            console.error("Error adding sale:", error);
        }
    };
    
    const handleDeleteSale = async (e, saleId) => {
        e.stopPropagation(); // Prevent row from expanding when deleting
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
                                                                <td className="px-4 py-2">{item.description}</td><td className="px-4 py-2">{t[item.category] || item.category}</td><td className="px-4 py-2 text-right">{item.quantity}</td><td className="px-4 py-2 text-left">{item.salesRep}</td><td className="px-4 py-2 text-right">{formatCurrency(item.total)}</td>
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
                            {SALE_CATEGORIES.map(c => <option key={c} value={c}>{t[c] || c}</option>)}
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
        const finalItems = items.map(item => ({
            ...item,
            quantity: -Math.abs(Number(item.quantity)),
            total: -Math.abs(Number(item.total))
        }));
        onAddSale({ ...transaction, items: finalItems, total: finalTotal });
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
                            {SALE_CATEGORIES.map(c => <option key={c} value={c}>{t[c] || c}</option>)}
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

const Schedule = ({ schedule, currentWeek, currentYear, db, appId, selectedStore, setNotification, t, language, allEmployees }) => {
    const [scheduleRows, setScheduleRows] = useState([]);
    const [editingObjectivesFor, setEditingObjectivesFor] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        setScheduleRows(schedule?.rows || []);
    }, [schedule]);

    const handleRowChange = (id, field, value, day) => {
        setScheduleRows(rows => rows.map(row => {
            if (row.id === id) {
                if(day) {
                    const newField = { ...row[field], [day]: value };
                    if (field === 'dailyObjectives') {
                        const newObjective = Object.values(newField).reduce((sum, val) => sum + (Number(val) || 0), 0);
                        return { ...row, [field]: newField, objective: newObjective };
                    }
                    return { ...row, [field]: newField };
                }
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleAddRow = () => {
        const newRow = { id: crypto.randomUUID(), name: '', employeeId: '', jobTitle: JOB_TITLES[0], objective: 0, shifts: {}, scheduledHours: {}, actualHours: {}, dailyObjectives: {} };
        setScheduleRows(rows => [...rows, newRow]);
    };

    const handleAddGuest = (employee) => {
        if (scheduleRows.some(r => r.id === employee.id)) {
            setNotification({message: `${employee.name} is already on this schedule.`, type: 'error'});
            return;
        }
        const newRow = { 
            id: employee.id, 
            name: employee.name, 
            employeeId: employee.positionId, 
            jobTitle: employee.jobTitle, 
            objective: 0, 
            shifts: {}, 
            scheduledHours: {}, 
            actualHours: {}, 
            dailyObjectives: {} 
        };
        setScheduleRows(rows => [...rows, newRow]);
        setIsGuestModalOpen(false);
    };

    const handleRemoveRow = (id) => {
        setScheduleRows(rows => rows.filter(row => row.id !== id));
    };

    const executeSaveSchedule = async () => {
        if (!db) return;
        setSaveState('saving');
        const scheduleDocId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/schedules`, scheduleDocId);
        try {
            await setDoc(docRef, {
                week: currentWeek,
                year: currentYear,
                rows: scheduleRows,
                storeId: selectedStore
            }, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.scheduleSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving schedule: ", error);
            setNotification({ message: t.errorSavingSchedule, type: 'error' });
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSaveSchedule();
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                        <button onClick={handleAddRow}
                                className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            <PlusCircle size={20} className="mr-2" />
                            {t.addToSchedule}
                        </button>
                         <button onClick={() => setIsGuestModalOpen(true)}
                                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            <UserPlus size={20} className="mr-2" />
                            {t.addGuestEmployee}
                        </button>
                    </div>
                    <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.saveSchedule} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 align-top">{t.employeeId}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.employeeName}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.jobTitleDescription}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.salesObjective}</th>
                                {weekDays.map(day => <th key={day} scope="col" className="px-2 py-3 text-center">{day}</th>)}
                                <th scope="col" className="px-4 py-3 align-top">{t.totalSchedHrs}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.totalActualHrs}</th>
                                <th scope="col" className="px-4 py-3 align-top">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scheduleRows.map(row => {
                                const totalScheduledHours = Object.values(row.scheduledHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                                const totalActualHours = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                                return (
                                    <tr key={row.id}>
                                        <td className="px-4 py-2"><input type="text" placeholder="ID" value={row.employeeId || ''} onChange={e => handleRowChange(row.id, 'employeeId', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-4 py-2"><input type="text" placeholder={t.enterName} value={row.name || ''} onChange={e => handleRowChange(row.id, 'name', e.target.value)} className="w-40 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-4 py-2">
                                            <select value={row.jobTitle} onChange={e => handleRowChange(row.id, 'jobTitle', e.target.value)} className="w-40 bg-gray-900 border border-gray-600 rounded-md px-2 py-1">
                                                {JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center space-x-2">
                                                <input type="number" placeholder={t.objective} value={row.objective || 0} readOnly className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1" />
                                                <button onClick={() => setEditingObjectivesFor(row)} className="text-blue-400 hover:text-blue-300"><Target size={18}/></button>
                                            </div>
                                        </td>
                                        {DAYS_OF_WEEK.map(day => (
                                            <td key={day} className="px-2 py-2">
                                                <div className="flex flex-col space-y-1">
                                                    <input type="text" placeholder={t.shift} value={row.shifts?.[day.toLowerCase()] || ''} onChange={(e) => {
                                                        const newHours = parseShift(e.target.value);
                                                        handleRowChange(row.id, 'shifts', e.target.value, day.toLowerCase());
                                                        handleRowChange(row.id, 'scheduledHours', newHours, day.toLowerCase());
                                                    }} className="w-24 bg-gray-900/70 border border-gray-600 rounded-md px-2 py-1 text-center" />
                                                    <input type="number" placeholder={t.sched} value={row.scheduledHours?.[day.toLowerCase()] || ''} readOnly className="w-24 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-center" />
                                                    <input type="number" placeholder={t.actual} value={row.actualHours?.[day.toLowerCase()] || ''} onChange={e => handleRowChange(row.id, 'actualHours', e.target.value, day.toLowerCase())} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-center" step="0.25" />
                                                </div>
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-center font-bold">{totalScheduledHours.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center font-bold">{totalActualHours.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => handleRemoveRow(row.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {isGuestModalOpen && <AddGuestModal allEmployees={allEmployees} scheduleRows={scheduleRows} onAddGuest={handleAddGuest} onClose={() => setIsGuestModalOpen(false)} t={t} />}
            {editingObjectivesFor && <DailyObjectiveModal t={t} language={language} row={editingObjectivesFor} onRowChange={handleRowChange} onClose={() => setEditingObjectivesFor(null)} />}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSaveSchedule}
                t={t}
            >
                <p>{t.confirmSaveScheduleMsg}</p>
            </ConfirmationModal>
        </>
    );
};

const AddGuestModal = ({ allEmployees, scheduleRows, onAddGuest, onClose, t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const scheduledEmployeeIds = useMemo(() => new Set(scheduleRows.map(r => r.id)), [scheduleRows]);
    
    const availableGuests = useMemo(() => {
        return allEmployees.filter(emp => 
            !scheduledEmployeeIds.has(emp.id) &&
            (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.positionId.includes(searchTerm))
        );
    }, [allEmployees, scheduledEmployeeIds, searchTerm]);

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.addGuestEmployee}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <input 
                    type="text"
                    placeholder={t.searchEmployee}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 mb-4"
                />
                <div className="max-h-96 overflow-y-auto">
                    {availableGuests.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-lg">
                            <div>
                                <p className="font-bold">{emp.name}</p>
                                <p className="text-sm text-gray-400">{emp.jobTitle} - {t.store} {emp.associatedStore}</p>
                            </div>
                            <button onClick={() => onAddGuest(emp)} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg"><PlusCircle size={16} className="mr-2"/> Add</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DailyObjectiveModal = ({ row, onRowChange, onClose, t, language }) => {
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.dailySalesObjectivesFor.replace('{name}', row.name)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {weekDays.map((day, index) => (
                        <div key={day}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{day}</label>
                            <input 
                                type="number" 
                                value={row.dailyObjectives?.[DAYS_OF_WEEK[index].toLowerCase()] || ''} 
                                onChange={e => onRowChange(row.id, 'dailyObjectives', e.target.value, DAYS_OF_WEEK[index].toLowerCase())} 
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" 
                            />
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.done}</button>
                </div>
            </div>
        </div>
    );
};

const STC = ({ stcData, currentWeek, currentYear, db, appId, selectedStore, setNotification, t, language }) => {
    const [activeDay, setActiveDay] = useState(new Date().getDay());
    const [dayData, setDayData] = useState({});
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const weekDays = language === 'fr' ? DAYS_OF_WEEK_FR : DAYS_OF_WEEK;

    useEffect(() => {
        setDayData(stcData.days || {});
    }, [stcData]);

    const handleDataChange = (hour, field, value) => {
        const dayKey = DAYS_OF_WEEK[activeDay].toLowerCase();
        const updatedDayData = {
            ...(dayData[dayKey] || {}),
            [hour]: {
                ...(dayData[dayKey]?.[hour] || {}),
                [field]: Number(value)
            }
        };
        setDayData(prev => ({
            ...prev,
            [dayKey]: updatedDayData
        }));
    };

    const executeSaveChanges = async () => {
        if (!db) return;
        setSaveState('saving');
        const stcDocId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/stc`, stcDocId);
        try {
            await setDoc(docRef, {
                week: currentWeek,
                year: currentYear,
                days: dayData,
                storeId: selectedStore
            }, { merge: true });
            setSaveState('saved');
            setNotification({ message: t.stcDataSavedSuccess, type: 'success' });
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving STC data: ", error);
            setNotification({ message: t.errorSavingStc, type: 'error' });
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSaveChanges();
    };
    
    const calculateConversion = (hourData) => {
        if (!hourData || !hourData.traffic || hourData.traffic === 0) return '0.00%';
        const conversion = (hourData.transactions || 0) / hourData.traffic * 100;
        return `${conversion.toFixed(2)}%`;
    };

    return (
        <>
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
                    <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.saveChanges} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t.hour}</th><th scope="col" className="px-6 py-3">{t.footTraffic}</th><th scope="col" className="px-6 py-3">{t.transactions}</th><th scope="col" className="px-6 py-3">{t.employees}</th><th scope="col" className="px-6 py-3">{t.conversion}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {OPERATING_HOURS.map(hour => {
                                const currentHourData = dayData[DAYS_OF_WEEK[activeDay].toLowerCase()]?.[hour] || {};
                                return (
                                    <tr key={hour}>
                                        <td className="px-6 py-4 font-medium text-white">{hour}</td>
                                        <td className="px-6 py-4"><input type="number" value={currentHourData.traffic || ''} onChange={(e) => handleDataChange(hour, 'traffic', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-6 py-4"><input type="number" value={currentHourData.transactions || ''} onChange={(e) => handleDataChange(hour, 'transactions', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-6 py-4"><input type="number" value={currentHourData.employees || ''} onChange={(e) => handleDataChange(hour, 'employees', e.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-md px-2 py-1" /></td>
                                        <td className="px-6 py-4 font-bold text-white">{calculateConversion(currentHourData)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSaveStc}
                t={t}
            >
                <p>{t.confirmSaveStcMsg.replace('{day}', weekDays[activeDay])}</p>
            </ConfirmationModal>
        </>
    );
};

const Payroll = ({ schedule, allWeeklySales, allWeeklySchedules, allEmployees, payroll, setPayroll, currentWeek, currentYear, db, appId, selectedStore, setNotification, t }) => {
    const [payrollData, setPayrollData] = useState([]);
    const [transfersInData, setTransfersInData] = useState([]);
    const [saveState, setSaveState] = useState('idle');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        if (!allEmployees || !allWeeklySchedules || !allWeeklySales) return;
        
        const homeStoreEmployees = allEmployees.filter(emp => emp.associatedStore === selectedStore);

        const initialData = homeStoreEmployees.map(employee => {
            const existingPayroll = payroll.rows?.find(p => p.id === employee.id) || {};
            
            let totalHours = 0;
            let workLocations = new Set();
            
            allWeeklySchedules.forEach(sched => {
                const row = sched.rows.find(r => r.id === employee.id);
                if (row) {
                    const hoursWorked = Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
                    if (hoursWorked > 0) {
                        totalHours += hoursWorked;
                        workLocations.add(sched.storeId);
                    }
                }
            });

            const regularHours = Math.min(totalHours, 40);
            const otHours = Math.max(0, totalHours - 40);
            
            let employeeSales = 0;
            allWeeklySales.forEach(sale => {
                if (sale.type === TRANSACTION_TYPES.GIFT_CARD) return;
                (sale.items || []).forEach(item => {
                    if (item.salesRep === employee.name) {
                        employeeSales += Number(item.total || (item.price * item.quantity) || 0);
                    }
                });
            });

            const workLocationsDisplay = Array.from(workLocations).map(loc => 
                loc === selectedStore ? `${loc} (Home)` : `${loc} (Guest)`
            ).join(', ');

            const newRow = {
                id: employee.id,
                payrollName: employee.name,
                positionId: employee.positionId,
                jobTitleDescription: employee.jobTitle,
                workLocationsDisplay: workLocationsDisplay,
                commissionPlan: existingPayroll.commissionPlan || (employee ? employee.commissionPlan || '2' : '2'),
                rate: existingPayroll.rate !== undefined ? existingPayroll.rate : (employee ? employee.rate : 0),
                base: existingPayroll.base !== undefined ? existingPayroll.base : (employee ? employee.baseSalary / 52 : 0),
                regularHours,
                otHours,
                salesResults: employeeSales,
                bonusPay: existingPayroll.bonusPay || 0,
                adjHrs: existingPayroll.adjHrs || 0,
                vacationHours: existingPayroll.vacationHours || 0,
                adjCommissions: existingPayroll.adjCommissions || 0,
                ecommerceCommissions: existingPayroll.ecommerceCommissions || 0,
                other: existingPayroll.other || 0,
                retroPay: existingPayroll.retroPay || 0,
                payInLieuQC: existingPayroll.payInLieuQC || 0,
                payInLieu: existingPayroll.payInLieu || 0,
                finalTerminationPay: existingPayroll.finalTerminationPay || 0,
                comments: existingPayroll.comments || '',
                statHoliday: existingPayroll.statHoliday || 0,
                personalHours: existingPayroll.personalHours || 0,
                sickHours: existingPayroll.sickHours || 0,
                commission: 0, // Will be recalculated
                subTotal: existingPayroll.subTotal || 0,
                adjustments: existingPayroll.adjustments || 0,
                statHolidayHours: existingPayroll.statHolidayHours || 0,
            };
            
            const commissionRate = parseFloat(newRow.commissionPlan) / 100;
            newRow.commission = !isNaN(commissionRate) ? newRow.salesResults * commissionRate : 0;

            const { rate, base, commission, bonusPay, adjCommissions, ecommerceCommissions, other, retroPay, payInLieuQC, payInLieu, finalTerminationPay, statHoliday, subTotal, adjustments } = newRow;
            const gross = (Number(rate) * (Number(regularHours) + Number(newRow.adjHrs) + Number(newRow.vacationHours) + Number(newRow.personalHours) + Number(newRow.sickHours) + Number(newRow.statHolidayHours))) +
                          (Number(rate) * 1.5 * Number(otHours)) +
                          Number(base) + Number(commission) + Number(bonusPay) + Number(adjCommissions) + Number(ecommerceCommissions) + Number(other) + Number(retroPay) + Number(payInLieuQC) + Number(payInLieu) + Number(finalTerminationPay) + Number(statHoliday) + Number(subTotal) + Number(adjustments);
            newRow.weeklyGrossEarnings = gross;

            return newRow;
        });
        setPayrollData(initialData);

        // Calculate Transfers In
        const guestEmployeesOnSchedule = (schedule.rows || []).filter(row => {
            const empData = allEmployees.find(emp => emp.id === row.id);
            return empData && empData.associatedStore !== selectedStore;
        });

        const transfers = guestEmployeesOnSchedule.map(guestRow => {
            const employeeData = allEmployees.find(emp => emp.id === guestRow.id);
            const hoursWorked = Object.values(guestRow.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0);
            
            let salesTotal = 0;
            const salesInCurrentStore = allWeeklySales.filter(s => s.storeId === selectedStore);
            salesInCurrentStore.forEach(sale => {
                (sale.items || []).forEach(item => {
                    if (item.salesRep === employeeData.name) {
                        salesTotal += Number(item.total || (item.price * item.quantity) || 0);
                    }
                });
            });

            const rate = employeeData.rate || 0;
            const earnings = rate * hoursWorked;
            const commissionRate = parseFloat(employeeData.commissionPlan || '2') / 100;
            const commission = salesTotal * commissionRate;
            const totalWages = earnings + commission;

            return {
                id: employeeData.id,
                name: employeeData.name,
                positionId: employeeData.positionId,
                homeStore: employeeData.associatedStore,
                hoursWorked,
                sales: salesTotal,
                rate,
                earnings,
                commission,
                totalWages
            };
        });
        setTransfersInData(transfers);


    }, [schedule, payroll, allWeeklySales, allWeeklySchedules, allEmployees, selectedStore]);

    const handlePayrollChange = (id, field, value) => {
        setPayrollData(currentData => currentData.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: value };
                
                const commissionRate = parseFloat(newRow.commissionPlan) / 100;
                newRow.commission = !isNaN(commissionRate) ? newRow.salesResults * commissionRate : 0;
                
                const { rate, regularHours, otHours, bonusPay, adjHrs, vacationHours, personalHours, sickHours, statHolidayHours, base, commission, adjCommissions, ecommerceCommissions, other, retroPay, payInLieuQC, payInLieu, finalTerminationPay, statHoliday, subTotal, adjustments } = newRow;
                const gross = (Number(rate) * (Number(regularHours) + Number(adjHrs) + Number(vacationHours) + Number(personalHours) + Number(sickHours) + Number(statHolidayHours))) +
                              (Number(rate) * 1.5 * Number(otHours)) +
                              Number(base) +
                              Number(commission) +
                              Number(bonusPay) + 
                              Number(adjCommissions) + 
                              Number(ecommerceCommissions) + 
                              Number(other) + 
                              Number(retroPay) + 
                              Number(payInLieuQC) + 
                              Number(payInLieu) + 
                              Number(finalTerminationPay) + 
                              Number(statHoliday) + 
                              Number(subTotal) + 
                              Number(adjustments);
                return { ...newRow, weeklyGrossEarnings: gross };
            }
            return row;
        }));
    };
    
    const executeSavePayroll = async () => {
        if (!db) return;
        setSaveState('saving');
        const payrollDocId = `${selectedStore}-${currentYear}-W${currentWeek}`;
        const docRef = doc(db, `artifacts/${appId}/public/data/payrolls`, payrollDocId);
        try {
            await setDoc(docRef, {
                rows: payrollData,
                storeId: selectedStore,
                week: currentWeek,
                year: currentYear
            }, { merge: true });
            setSaveState('saved');
            setNotification({message: t.payrollDataSavedSuccess, type: 'success'});
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Error saving payroll data:", error);
            setNotification({message: t.errorSavingPayroll, type: 'error'});
            setSaveState('idle');
        }
    };

    const handleSaveClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false);
        executeSavePayroll();
    };
    
    const payrollColumns = [
        { header: 'Payroll Name', field: 'payrollName', color: 'yellow', readOnly: true, width: 'w-48' },
        { header: 'Position ID', field: 'positionId', color: 'yellow', readOnly: true, width: 'w-24' },
        { header: 'Job Title Description', field: 'jobTitleDescription', color: 'yellow', readOnly: true, width: 'w-48' },
        { header: 'Work Locations', field: 'workLocationsDisplay', color: 'blue', readOnly: true, width: 'w-48' },
        { header: 'COMMISSION PLAN', field: 'commissionPlan', color: 'yellow', type: 'text', width: 'w-32' },
        { header: 'Rate', field: 'rate', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Base', field: 'base', color: 'white', type: 'number', width: 'w-24' },
        { header: 'Commission $$$', field: 'commission', color: 'green', type: 'number', readOnly: true, width: 'w-32' },
        { header: 'Regular Hours', field: 'regularHours', color: 'white', type: 'number', readOnly: true, width: 'w-32' },
        { header: 'OT Hrs', field: 'otHours', color: 'white', type: 'number', readOnly: true, width: 'w-24' },
        { header: 'Sales Results', field: 'salesResults', color: 'white', type: 'number', readOnly: true, width: 'w-32' },
        { header: 'Bonus Pay $$$', field: 'bonusPay', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Sub-Total', field: 'subTotal', color: 'green', type: 'number', width: 'w-32' },
        { header: 'Adjustments $$$', field: 'adjustments', color: 'green', type: 'number', width: 'w-32' },
        { header: 'Weekly Gross Earnings', field: 'weeklyGrossEarnings', color: 'pink', type: 'number', readOnly: true, width: 'w-40' },
        { header: 'ADJ HRS', field: 'adjHrs', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Stat Holiday Hours', field: 'statHolidayHours', color: 'green', type: 'number', width: 'w-24' },
        { header: 'Vacation Hours', field: 'vacationHours', color: 'white', type: 'number', width: 'w-24' },
        { header: 'Adj. Commissions $$$', field: 'adjCommissions', color: 'white', type: 'number', width: 'w-32' },
        { header: 'E-Commerce Commissions$$$', field: 'ecommerceCommissions', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Other $$$', field: 'other', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Retro Pay $$$', field: 'retroPay', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Pay in Lieu QC $$$', field: 'payInLieuQC', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Pay in Lieu $$$', field: 'payInLieu', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Final Termination Pay $$$', field: 'finalTerminationPay', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Comments', field: 'comments', color: 'white', type: 'text', width: 'w-64' },
        { header: 'Stat Holiday $$$', field: 'statHoliday', color: 'white', type: 'number', width: 'w-32' },
        { header: 'Personal Hours', field: 'personalHours', color: 'white', type: 'number', width: 'w-24' },
        { header: 'Sick Hours', field: 'sickHours', color: 'white', type: 'number', width: 'w-24' },
    ];
    
    const totals = useMemo(() => {
        const initialTotals = {};
        payrollColumns.forEach(col => {
            if (col.type === 'number') {
                initialTotals[col.field] = 0;
            }
        });
        payrollData.forEach(row => {
            payrollColumns.forEach(col => {
                if (col.type === 'number') {
                    initialTotals[col.field] += Number(row[col.field]) || 0;
                }
            });
        });
        return initialTotals;
    }, [payrollData]);

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{t.payroll}</h2>
                    <SaveButton onClick={handleSaveClick} saveState={saveState} text={t.savePayroll} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400 border-collapse">
                        <thead className="text-xs text-gray-300 uppercase">
                            <tr>
                                {payrollColumns.map(col => (
                                    <th key={col.field} scope="col" className={`px-2 py-3 sticky top-0 bg-gray-700 z-10 border border-gray-600 ${col.color === 'yellow' ? 'bg-yellow-900/50' : col.color === 'green' ? 'bg-green-900/50' : col.color === 'pink' ? 'bg-pink-900/50' : ''} ${col.width}`}>
                                        {t[col.field] || col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {payrollData.map(row => (
                                <tr key={row.id} className="bg-gray-800 border-b border-gray-700">
                                    {payrollColumns.map(col => (
                                        <td key={col.field} className={`px-1 py-1 border border-gray-700 ${col.color === 'yellow' ? 'bg-yellow-800/20' : col.color === 'green' ? 'bg-green-800/20' : col.color === 'pink' ? 'bg-pink-800/20' : ''}`}>
                                            {col.readOnly ? (
                                                <span className="px-2 py-1 block">{col.field.includes('$$$') || col.field === 'rate' || col.field === 'base' || col.field === 'weeklyGrossEarnings' || col.field === 'salesResults' ? formatCurrency(row[col.field]) : row[col.field]}</span>
                                            ) : col.field === 'commissionPlan' ? (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={row[col.field]}
                                                        onChange={(e) => handlePayrollChange(row.id, col.field, e.target.value)}
                                                        className="w-full bg-transparent focus:bg-gray-900 outline-none rounded-md px-2 py-1 pr-4"
                                                    />
                                                    <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">%</span>
                                                </div>
                                            ) : (
                                                <input
                                                    type={col.type || 'text'}
                                                    value={row[col.field]}
                                                    onChange={(e) => handlePayrollChange(row.id, col.field, e.target.value)}
                                                    className="w-full bg-transparent focus:bg-gray-900 outline-none rounded-md px-2 py-1"
                                                />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="text-white font-bold bg-gray-700">
                            <tr>
                                 {payrollColumns.map(col => (
                                    <td key={col.field} className="px-2 py-2 text-right border border-gray-600">
                                        {col.type === 'number' ? (col.field.includes('$$$') || col.field === 'rate' || col.field === 'base' || col.field === 'weeklyGrossEarnings' || col.field === 'salesResults' ? formatCurrency(totals[col.field]) : totals[col.field].toFixed(2)) : (col.field === 'payrollName' ? t.totals : '')}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
                <h2 className="text-2xl font-bold text-white mb-6">{t.transfersIn}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">{t.employeeName}</th>
                                <th className="px-4 py-3">{t.positionId}</th>
                                <th className="px-4 py-3">{t.homeStore}</th>
                                <th className="px-4 py-3">{t.hrs}</th>
                                <th className="px-4 py-3">{t.netSales}</th>
                                <th className="px-4 py-3">{t.rate}</th>
                                <th className="px-4 py-3">{t.earnings}</th>
                                <th className="px-4 py-3">{t.commission}</th>
                                <th className="px-4 py-3">{t.totalWages}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfersInData.map(row => (
                                <tr key={row.id} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-4 py-2">{row.name}</td>
                                    <td className="px-4 py-2">{row.positionId}</td>
                                    <td className="px-4 py-2">{row.homeStore}</td>
                                    <td className="px-4 py-2">{row.hoursWorked.toFixed(2)}</td>
                                    <td className="px-4 py-2">{formatCurrency(row.sales)}</td>
                                    <td className="px-4 py-2">{formatCurrency(row.rate)}</td>
                                    <td className="px-4 py-2">{formatCurrency(row.earnings)}</td>
                                    <td className="px-4 py-2">{formatCurrency(row.commission)}</td>
                                    <td className="px-4 py-2 font-bold">{formatCurrency(row.totalWages)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title={t.confirmSavePayroll}
                t={t}
            >
                <p>{t.confirmSavePayrollMsg}</p>
            </ConfirmationModal>
        </>
    );
};

const Reports = ({ sales, schedule, db, appId, selectedStore, currentYear, currentWeek, t }) => {
    const [historicalData, setHistoricalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistoricalData = async () => {
            if (!db || !selectedStore) return;
            setIsLoading(true);
            const data = [];
            const weeksToFetch = 8;
            const basePath = `artifacts/${appId}/public/data`;

            for (let i = 0; i < weeksToFetch; i++) {
                const week = currentWeek - i;
                // Basic handling for year change, more robust logic might be needed
                const year = week <= 0 ? currentYear - 1 : currentYear;
                const adjustedWeek = week <= 0 ? 52 + week : week;

                const salesQuery = query(collection(db, `${basePath}/sales`), where("storeId", "==", selectedStore), where("week", "==", adjustedWeek), where("year", "==", year));
                const scheduleDocRef = doc(db, `${basePath}/schedules`, `${selectedStore}-${year}-W${adjustedWeek}`);
                const stcDocRef = doc(db, `${basePath}/stc`, `${selectedStore}-${year}-W${adjustedWeek}`);

                const [salesSnapshot, scheduleDoc, stcDoc] = await Promise.all([
                    getDocs(salesQuery),
                    getDoc(scheduleDocRef),
                    getDoc(stcDocRef)
                ]);

                const weeklySales = salesSnapshot.docs.map(d => d.data());
                const weeklySchedule = scheduleDoc.exists() ? scheduleDoc.data() : { rows: [] };
                const weeklyStc = stcDoc.exists() ? stcDoc.data() : { days: {} };

                data.push({ week: adjustedWeek, year, sales: weeklySales, schedule: weeklySchedule, stc: weeklyStc });
            }

            setHistoricalData(data.reverse()); // Oldest to newest
            setIsLoading(false);
        };

        fetchHistoricalData();
    }, [db, selectedStore, currentWeek, currentYear, appId]);

    const trendData = useMemo(() => {
        return historicalData.map(weeklyData => {
            const { sales, schedule, stc } = weeklyData;
            
            const merchandiseSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD && s.type !== TRANSACTION_TYPES.RETURN);
            const netSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD).reduce((sum, s) => sum + s.total, 0);
            const totalTransactions = merchandiseSales.length;
            const totalUnits = merchandiseSales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);
            
            const totalTraffic = Object.values(stc.days || {}).reduce((daySum, dayData) => daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.traffic || 0), 0), 0);
            const totalSTCTransactions = Object.values(stc.days || {}).reduce((daySum, dayData) => daySum + Object.values(dayData).reduce((hourSum, hour) => hourSum + (hour.transactions || 0), 0), 0);
            const totalHours = (schedule.rows || []).reduce((sum, row) => sum + Object.values(row.actualHours || {}).reduce((hSum, h) => hSum + Number(h), 0), 0);

            return {
                name: `W${weeklyData.week}`,
                netSales,
                conversionRate: totalTraffic > 0 ? (totalSTCTransactions / totalTraffic) * 100 : 0,
                dollarsPerHour: totalHours > 0 ? netSales / totalHours : 0,
                avgTransactionValue: totalTransactions > 0 ? netSales / totalTransactions : 0,
                unitsPerTransaction: totalTransactions > 0 ? totalUnits / totalTransactions : 0,
            };
        });
    }, [historicalData]);

    const { totalSales, totalReturns, avgTransactionValue, unitsPerTransaction, giftCardSales, categoryContribution } = useMemo(() => {
        const merchandiseSales = sales.filter(s => s.type !== TRANSACTION_TYPES.GIFT_CARD && s.type !== TRANSACTION_TYPES.RETURN);
        const returns = sales.filter(s => s.type === TRANSACTION_TYPES.RETURN);
        const giftCardSalesData = sales.filter(s => s.type === TRANSACTION_TYPES.GIFT_CARD);

        const totalTransactions = merchandiseSales.length;
        const grossSales = merchandiseSales.reduce((sum, s) => sum + s.total, 0);
        const totalReturnValue = returns.reduce((sum, s) => sum + s.total, 0);
        const netSales = grossSales + totalReturnValue; // totalReturnValue is negative

        const totalQuantity = merchandiseSales.reduce((sum, sale) => {
            return sum + (sale.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0);
        }, 0);

        const categoryTotals = {};
        sales.forEach(sale => {
            if (sale.type !== TRANSACTION_TYPES.RETURN) {
                (sale.items || []).forEach(item => {
                    if (!categoryTotals[item.category]) {
                        categoryTotals[item.category] = 0;
                    }
                    categoryTotals[item.category] += Number(item.total || (item.price * item.quantity) || 0);
                });
            }
        });

        const contributionData = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0);
        
        return {
            totalSales: netSales,
            totalReturns: totalReturnValue,
            avgTransactionValue: totalTransactions > 0 ? netSales / totalTransactions : 0,
            unitsPerTransaction: totalTransactions > 0 ? totalQuantity / totalTransactions : 0,
            giftCardSales: giftCardSalesData.reduce((sum, s) => sum + s.total, 0),
            categoryContribution: contributionData
        };
    }, [sales]);

    const weeklySellersAnalysis = useMemo(() => {
        if (!schedule?.rows) return [];
        const employeeAnalysis = new Map();

        schedule.rows.filter(row => row.name).forEach(row => {
            employeeAnalysis.set(row.name, {
                name: row.name,
                objective: row.objective || 0,
                totalSales: 0,
                numTransactions: 0,
                unitsSold: 0,
                hoursWorked: Object.values(row.actualHours || {}).reduce((sum, h) => sum + (Number(h) || 0), 0),
                categoryUnits: SALE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {})
            });
        });

        const transactionSellers = new Map();

        sales.forEach(sale => {
            if (sale.type === TRANSACTION_TYPES.GIFT_CARD) return;
            
            (sale.items || []).forEach(item => {
                const rep = item.salesRep;
                const itemValue = Number(item.total || (item.price * item.quantity) || 0);

                if (employeeAnalysis.has(rep)) {
                    const emp = employeeAnalysis.get(rep);
                    emp.totalSales += itemValue;
                    
                    if (sale.type !== TRANSACTION_TYPES.RETURN) {
                        emp.unitsSold += item.quantity;
                        emp.categoryUnits[item.category] += item.quantity;
                        
                        if (!transactionSellers.has(sale.id)) {
                            transactionSellers.set(sale.id, new Set());
                        }
                        transactionSellers.get(sale.id).add(rep);
                    }
                }
            });
        });
        
        transactionSellers.forEach((reps) => {
            reps.forEach(repName => {
                if (employeeAnalysis.has(repName)) {
                    employeeAnalysis.get(repName).numTransactions += 1;
                }
            });
        });


        return Array.from(employeeAnalysis.values()).map(emp => ({
            ...emp,
            differential: emp.totalSales - emp.objective,
            percentOfObjective: emp.objective > 0 ? (emp.totalSales / emp.objective) * 100 : 0,
            dollarsPerHour: emp.hoursWorked > 0 ? emp.totalSales / emp.hoursWorked : 0,
            dollarsPerTransaction: emp.numTransactions > 0 ? emp.totalSales / emp.numTransactions : 0,
            unitsPerTransaction: emp.numTransactions > 0 ? emp.unitsSold / emp.numTransactions : 0,
        }));

    }, [sales, schedule]);

    const analysisTotals = useMemo(() => {
        const totals = {
            objective: 0,
            totalSales: 0,
            differential: 0,
            numTransactions: 0,
            unitsSold: 0,
            hoursWorked: 0,
            categoryUnits: {}
        };
        SALE_CATEGORIES.forEach(cat => totals.categoryUnits[cat] = 0);

        weeklySellersAnalysis.forEach(seller => {
            totals.objective += seller.objective;
            totals.totalSales += seller.totalSales;
            totals.numTransactions += seller.numTransactions;
            totals.unitsSold += seller.unitsSold;
            totals.hoursWorked += seller.hoursWorked;
            SALE_CATEGORIES.forEach(cat => {
                totals.categoryUnits[cat] += seller.categoryUnits[cat];
            });
        });

        totals.differential = totals.totalSales - totals.objective;
        totals.percentOfObjective = totals.objective > 0 ? (totals.totalSales / totals.objective) * 100 : 0;
        totals.dollarsPerHour = totals.hoursWorked > 0 ? totals.totalSales / totals.hoursWorked : 0;
        totals.dollarsPerTransaction = totals.numTransactions > 0 ? totals.totalSales / totals.numTransactions : 0;
        totals.unitsPerTransaction = totals.numTransactions > 0 ? totals.unitsSold / totals.numTransactions : 0;

        return totals;
    }, [weeklySellersAnalysis]);

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                 <h2 className="text-xl font-bold mb-4 text-white">{t.currentWeekPerformance}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <ReportStatCard title={t.netSales} value={formatCurrency(totalSales)} />
                    <ReportStatCard title={t.totalReturns} value={formatCurrency(totalReturns)} />
                    <ReportStatCard title={t.giftCardsSold} value={formatCurrency(giftCardSales)} />
                    <ReportStatCard title={t.avgDollarValue} value={formatCurrency(avgTransactionValue)} />
                    <ReportStatCard title={t.upt} value={unitsPerTransaction.toFixed(2)} />
                 </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.salesContributionByCategory}</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie data={categoryContribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label={(entry) => `${t[entry.name] || entry.name} (${(entry.percent * 100).toFixed(0)}%)`}>
                                {categoryContribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">{t.weeklyTrendAnalysis}</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="animate-spin text-blue-400" size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <TrendChart data={trendData} dataKey="netSales" title={t.netSales} color="#8884d8" formatter={formatCurrency} />
                            <TrendChart data={trendData} dataKey="conversionRate" title={t.conversionRate} color="#82ca9d" formatter={(v) => `${v.toFixed(2)}%`} />
                            <TrendChart data={trendData} dataKey="dollarsPerHour" title={t.dph} color="#ffc658" formatter={formatCurrency} />
                            <TrendChart data={trendData} dataKey="avgTransactionValue" title={t.dpt} color="#ff8042" formatter={formatCurrency} />
                        </div>
                    )}
                </div>
             </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">{t.currentWeekSellersAnalysis}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th className="px-2 py-3">{t.seller}</th>
                                <th className="px-2 py-3 text-right">{t.objective}</th>
                                <th className="px-2 py-3 text-right">{t.netSales}</th>
                                <th className="px-2 py-3 text-right">{t.differential}</th>
                                <th className="px-2 py-3 text-right">{t.percent}</th>
                                <th className="px-2 py-3 text-right">{t.numTrans}</th>
                                <th className="px-2 py-3 text-right">{t.units}</th>
                                <th className="px-2 py-3 text-right">{t.hrs}</th>
                                <th className="px-2 py-3 text-right">{t.dph}</th>
                                <th className="px-2 py-3 text-right">{t.dpt}</th>
                                <th className="px-2 py-3 text-right">{t.upt}</th>
                                {SALE_CATEGORIES.map(cat => <th key={cat} className="px-2 py-3 text-right">{t[cat] || cat.slice(0,5)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {weeklySellersAnalysis.map(seller => (
                                <tr key={seller.name} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-2 py-2 font-medium">{seller.name}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.objective)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.totalSales)}</td>
                                    <td className={`px-2 py-2 text-right ${seller.differential < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(seller.differential)}</td>
                                    <td className="px-2 py-2 text-right">{seller.percentOfObjective.toFixed(2)}%</td>
                                    <td className="px-2 py-2 text-right">{seller.numTransactions.toFixed(0)}</td>
                                    <td className="px-2 py-2 text-right">{seller.unitsSold.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{seller.hoursWorked.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.dollarsPerHour)}</td>
                                    <td className="px-2 py-2 text-right">{formatCurrency(seller.dollarsPerTransaction)}</td>
                                    <td className="px-2 py-2 text-right">{seller.unitsPerTransaction.toFixed(2)}</td>
                                    {SALE_CATEGORIES.map(cat => <td key={cat} className="px-2 py-2 text-right">{seller.categoryUnits[cat].toFixed(2)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="text-white font-bold bg-gray-700">
                            <tr>
                                <td className="px-2 py-3">{t.totals}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.objective)}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.totalSales)}</td>
                                <td className={`px-2 py-3 text-right ${analysisTotals.differential < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(analysisTotals.differential)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.percentOfObjective.toFixed(2)}%</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.numTransactions.toFixed(0)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.unitsSold.toFixed(0)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.hoursWorked.toFixed(2)}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.dollarsPerHour)}</td>
                                <td className="px-2 py-3 text-right">{formatCurrency(analysisTotals.dollarsPerTransaction)}</td>
                                <td className="px-2 py-3 text-right">{analysisTotals.unitsPerTransaction.toFixed(2)}</td>
                                {SALE_CATEGORIES.map(cat => <td key={cat} className="px-2 py-3 text-right">{analysisTotals.categoryUnits[cat].toFixed(0)}</td>)}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

const TrendChart = ({ data, dataKey, title, color, formatter }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" tickFormatter={formatter} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#2D3748', border: 'none', color: '#E2E8F0', borderRadius: '0.5rem' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value) => [formatter(value), title]}
                />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);


const ReportStatCard = ({ title, value }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

function App() {
    const [view, setView] = useState('storeSelector'); // 'storeSelector', 'admin', 'dashboard'
    const [currentPage, setCurrentPage] = useState('Dashboard');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [selectedStore, setSelectedStore] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [language, setLanguage] = useState(navigator.language.startsWith('fr') ? 'fr' : 'en');
    
    const currentWeek = useMemo(() => getWeekNumber(currentDate), [currentDate]);
    const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);

    const [sales, setSales] = useState([]);
    const [schedule, setSchedule] = useState({ rows: [] });
    const [stcData, setStcData] = useState({ days: {} });
    const [performanceGoals, setPerformanceGoals] = useState({});
    const [payroll, setPayroll] = useState({});
    const [notification, setNotification] = useState(null);
    const [allEmployees, setAllEmployees] = useState([]);
    const [dailyPlanner, setDailyPlanner] = useState(null);

    const [isPayrollUnlocked, setIsPayrollUnlocked] = useState(false);
    const [passcodeChallenge, setPasscodeChallenge] = useState(null);
    
    const [allWeeklySchedules, setAllWeeklySchedules] = useState([]);
    const [allWeeklySales, setAllWeeklySales] = useState([]);

    const t = translations[language];

    // --- Firebase Authentication Effect ---
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthReady(true);
            } else {
                try {
                    // When running in a custom environment, we should rely on anonymous sign-in
                    // as the __initial_auth_token is specific to the original environment.
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Authentication error:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- Firestore Data Fetching Effects ---
    useEffect(() => {
        if (!isAuthReady || !db) return;

        const employeesCollectionRef = collection(db, `artifacts/${appId}/public/data/employees`);
        const unsubEmployees = onSnapshot(employeesCollectionRef, (snapshot) => {
            setAllEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => console.error("Error fetching employees:", err));

        return () => unsubEmployees();
    }, [isAuthReady, db, appId]);


    useEffect(() => {
        if (!isAuthReady || !db || (view === 'dashboard' && !selectedStore)) return;

        if (view === 'dashboard') {
            const commonQueryParts = [where("week", "==", currentWeek), where("year", "==", currentYear)];
            const basePath = `artifacts/${appId}/public/data`;

            // Fetch data for the selected store
            const salesQuery = query(collection(db, `${basePath}/sales`), where("storeId", "==", selectedStore), ...commonQueryParts);
            const unsubSales = onSnapshot(salesQuery, (snapshot) => setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error("Error fetching sales:", err));
            
            const scheduleDocRef = doc(db, `${basePath}/schedules`, `${selectedStore}-${currentYear}-W${currentWeek}`);
            const unsubSchedule = onSnapshot(scheduleDocRef, (doc) => {
                const loadedScheduleData = doc.exists() ? doc.data() : { rows: [] };
                setSchedule(loadedScheduleData);
            }, err => console.error("Error fetching schedule:", err));

            const stcDocRef = doc(db, `${basePath}/stc`, `${selectedStore}-${currentYear}-W${currentWeek}`);
            const unsubStc = onSnapshot(stcDocRef, (doc) => setStcData(doc.exists() ? doc.data() : { days: {}, week: currentWeek, year: currentYear }), err => console.error("Error fetching STC data:", err));

            const goalsDocRef = doc(db, `${basePath}/performance_goals`, `${selectedStore}-${currentYear}-W${currentWeek}`);
            const unsubGoals = onSnapshot(goalsDocRef, (doc) => setPerformanceGoals(doc.exists() ? doc.data() : {}), err => console.error("Error fetching performance goals:", err));
            
            const payrollDocRef = doc(db, `${basePath}/payrolls`, `${selectedStore}-${currentYear}-W${currentWeek}`);
            const unsubPayroll = onSnapshot(payrollDocRef, (doc) => setPayroll(doc.exists() ? doc.data() : {}), err => console.error("Error fetching payroll:", err));
            
            const plannerDocId = `${selectedStore}-${currentDate.toISOString().split('T')[0]}`;
            const plannerDocRef = doc(db, `${basePath}/planners`, plannerDocId);
            const unsubPlanner = onSnapshot(plannerDocRef, (doc) => {
                setDailyPlanner(doc.exists() ? { id: doc.id, ...doc.data() } : { id: plannerDocId, notes: '', priorities: [], tasks: [] });
            }, err => console.error("Error fetching planner:", err));

            // Fetch all weekly data for payroll calculations
            const allSalesQuery = query(collection(db, `${basePath}/sales`), ...commonQueryParts);
            const unsubAllSales = onSnapshot(allSalesQuery, (snapshot) => setAllWeeklySales(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error("Error fetching all sales:", err));
            
            const allSchedulesQuery = query(collection(db, `${basePath}/schedules`), ...commonQueryParts);
            const unsubAllSchedules = onSnapshot(allSchedulesQuery, (snapshot) => setAllWeeklySchedules(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error("Error fetching all schedules:", err));


            return () => {
                unsubSales();
                unsubSchedule();
                unsubStc();
                unsubGoals();
                unsubPayroll();
                unsubPlanner();
                unsubAllSales();
                unsubAllSchedules();
            };
        }
    }, [isAuthReady, currentWeek, currentYear, selectedStore, view, currentDate]);

    const handleNavClick = (page) => {
        if (page !== 'Payroll') {
            setIsPayrollUnlocked(false);
        }
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
        } else if (passcodeChallenge?.type === 'admin') {
            setView('admin');
        }
        setPasscodeChallenge(null);
    };

    const renderPage = () => {
        const props = { sales, schedule, allEmployees, stcData, performanceGoals, payroll, setPayroll, currentWeek, currentYear, db, appId, selectedStore, t, setNotification, dailyPlanner, currentDate, language, allWeeklySales, allWeeklySchedules };
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
            <Sidebar currentPage={currentPage} onNavClick={handleNavClick} onChangeStore={() => {setSelectedStore(null); setView('storeSelector'); setIsPayrollUnlocked(false);}} t={t} />
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

export default App;
