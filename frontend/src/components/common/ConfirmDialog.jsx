import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[10000]"
        >
            <div 
                className="bg-white border-2 border-gray-200 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-fadeIn"
            >
                <div className="flex items-start gap-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-800 text-sm font-medium">
                        {message}
                    </p>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
