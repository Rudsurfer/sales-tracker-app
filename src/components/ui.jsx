import React from 'react';
import { Save, RefreshCw, CheckCircle } from 'lucide-react';

export const SaveButton = ({ onClick, saveState, text = 'Save' }) => {
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

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, t }) => {
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
