import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const WeekNavigator = ({ currentDate, setCurrentDate, currentWeek, language }) => {
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
