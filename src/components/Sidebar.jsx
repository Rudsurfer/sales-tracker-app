import React from 'react';
import { BarChart2, Target, ClipboardList, Calendar, FileText, DollarSign, TrendingUp, Users, LogOut, Clock } from 'lucide-react';

export const Sidebar = ({ currentPage, onNavClick, onChangeStore, t }) => {
    const navItems = [
        { name: 'Dashboard', key: 'dashboard', icon: BarChart2 },
        { name: 'Performance Goals', key: 'performanceGoals', icon: Target },
        { name: 'Daily Planner', key: 'dailyPlanner', icon: ClipboardList },
        { name: 'Schedule', key: 'schedule', icon: Calendar },
        { name: 'Payroll', key: 'payroll', icon: FileText },
        { name: 'Daily Sales Log', key: 'dailySalesLog', icon: DollarSign },
        { name: 'STC', key: 'stc', icon: TrendingUp },
        { name: 'Reports', key: 'reports', icon: Users },
        { name: 'Time Clock', key: 'timeClock', icon: Clock },
    ];
    return (
        <nav className="w-64 bg-gray-800/50 p-4 flex flex-col no-print">
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
