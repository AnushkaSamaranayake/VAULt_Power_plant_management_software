import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-yellow-50 border-yellow-200'
    };

    const textColors = {
        success: 'text-green-800',
        error: 'text-red-800',
        info: 'text-blue-800',
        warning: 'text-yellow-800'
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-600" />,
        error: <AlertCircle className="w-5 h-5 text-red-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />,
        warning: <AlertCircle className="w-5 h-5 text-yellow-600" />
    };

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[10000]"
        >
            <div 
                className={`${bgColors[type]} border-2 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-fadeIn`}
            >
                <div className="flex items-start gap-3 mb-4">
                    {icons[type]}
                    <p className={`${textColors[type]} text-sm font-medium flex-1`}>
                        {message}
                    </p>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 ${textColors[type]} bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
