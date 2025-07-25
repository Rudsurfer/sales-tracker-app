import React, { useState } from 'react';
import { Shield } from 'lucide-react';

export const PasscodeModal = ({ correctPasscode, onSuccess, onClose, t }) => {
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