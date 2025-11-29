import React from 'react';

const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
    const iconColor = {
        warning: 'text-yellow-500',
        danger: 'text-red-500',
        info: 'text-blue-500',
        success: 'text-green-500'
    }[type] || 'text-gray-500';

    const confirmButtonColor = {
        warning: 'bg-yellow-500 hover:bg-yellow-600',
        danger: 'bg-red-500 hover:bg-red-600',
        info: 'bg-blue-500 hover:bg-blue-600',
        success: 'bg-green-500 hover:bg-green-600'
    }[type] || 'bg-gray-500 hover:bg-gray-600';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
                <div className="p-6">
                    {/* Icon */}
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-${type === 'danger' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-100 mb-4`}>
                        <svg className={`h-6 w-6 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {type === 'danger' || type === 'warning' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                        </svg>
                    </div>

                    {/* Title */}
                    {title && (
                        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                            {title}
                        </h3>
                    )}

                    {/* Message */}
                    <p className="text-sm text-gray-500 text-center mb-6">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium text-white ${confirmButtonColor} rounded-md transition-colors`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;