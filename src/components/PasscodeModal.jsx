import React, { useState } from 'react';

export const PasscodeModal = ({ onSuccess, onClose, t, API_BASE_URL, isManagerCheck = false, correctPasscode }) => {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');

    const handleInput = (num) => {
        if (passcode.length < 6) {
            setPasscode(passcode + num);
        }
    };

    const handleDelete = () => {
        setPasscode(passcode.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (isManagerCheck) {
            try {
                const response = await fetch(`${API_BASE_URL}/timelog/verify-manager`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ positionId: passcode })
                });
                if (response.ok) {
                    onSuccess();
                } else {
                    setError('Invalid Manager PIN');
                    setPasscode('');
                }
            } catch (err) {
                setError('Error verifying manager status');
                setPasscode('');
            }
        } else {
            if (passcode === correctPasscode) {
                onSuccess();
            } else {
                setError(t.invalidPin);
                setPasscode('');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700 w-full max-w-xs text-center">
                <h2 className="text-2xl font-bold text-white mb-4">{t.enterPasscode}</h2>
                <p className="text-gray-400 mb-6">{t.sectionRestricted}</p>
                <div className="bg-gray-900 text-white text-3xl tracking-widest rounded-lg mb-4 h-16 flex items-center justify-center">
                    {passcode.padEnd(6, '•')}
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleInput(num)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl p-4 rounded-lg">{num}</button>
                    ))}
                    <div />
                    <button onClick={() => handleInput(0)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl p-4 rounded-lg">0</button>
                    <button onClick={handleDelete} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-4 rounded-lg">⌫</button>
                </div>
                <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xl">{t.unlock}</button>
                <button onClick={onClose} className="mt-4 text-gray-400 hover:text-white">{t.cancel}</button>
            </div>
        </div>
    );
};