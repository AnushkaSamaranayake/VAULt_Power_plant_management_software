import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    }[type] || 'bg-gray-500';

    const icon = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    }[type] || 'ℹ';

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px]`}>
                <span className="text-xl font-bold">{icon}</span>
                <span className="flex-1">{message}</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-2 text-white hover:text-gray-200 font-bold"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default Toast;