import React from 'react';
import { UserCog, Clock } from 'lucide-react';
import { FRENCH_STORES, ENGLISH_STORES } from '../constants';

export const StoreSelector = ({ onSelectStore, onAdminClick, onTimeClockClick, language, setLanguage, t }) => {
    const storesToShow = language === 'fr' ? FRENCH_STORES : ENGLISH_STORES;
    
    return (
        <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
            <div className="absolute top-4 right-4 flex items-center">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-l-md text-sm font-bold ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>EN</button>
                <button onClick={() => setLanguage('fr')} className={`px-3 py-1 rounded-r-md text-sm font-bold ${language === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>FR</button>
            </div>
            <div className="absolute top-4 left-4 flex gap-4">
                <button onClick={onAdminClick} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    <UserCog size={18} className="mr-2" />
                    {t.admin}
                </button>
                <button onClick={onTimeClockClick} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    <Clock size={18} className="mr-2" />
                    {t.timeClock}
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