import React from 'react';

export const Notification = ({ message, type }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed bottom-5 right-5 text-white px-6 py-4 rounded-lg shadow-lg z-50 ${bgColor}`}>
            {message}
        </div>
    );
};