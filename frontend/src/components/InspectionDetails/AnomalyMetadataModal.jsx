import React from 'react';
import { X, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const AnomalyMetadataModal = ({ isOpen, onClose, anomalyData, anomalyIndex }) => {
    if (!isOpen || !anomalyData) return null;

    const [x1, y1, x2, y2] = anomalyData.box;
    const width = x2 - x1;
    const height = y2 - y1;
    const area = width * height;
    
    const getClassInfo = (classId) => {
        switch (classId) {
            case 0:
                return {
                    name: 'Faulty',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600" />
                };
            case 1:
                return {
                    name: 'Normal',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    icon: <CheckCircle className="w-5 h-5 text-green-600" />
                };
            case 2:
                return {
                    name: 'Potentially Faulty',
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    icon: <AlertCircle className="w-5 h-5 text-orange-600" />
                };
            default:
                return {
                    name: 'Unknown',
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    icon: <AlertCircle className="w-5 h-5 text-gray-600" />
                };
        }
    };

    const getSeverityLevel = (confidence) => {
        if (confidence >= 0.8) return { level: 'High', color: 'text-red-600' };
        if (confidence >= 0.6) return { level: 'Medium', color: 'text-orange-600' };
        return { level: 'Low', color: 'text-yellow-600' };
    };

    const classInfo = getClassInfo(anomalyData.class);
    const severity = getSeverityLevel(anomalyData.confidence);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${classInfo.borderColor} ${classInfo.bgColor}`}>
                    <div className="flex items-center space-x-3">
                        {classInfo.icon}
                        <div>
                            <h3 className={`font-semibold text-lg ${classInfo.color}`}>
                                Anomaly #{anomalyIndex + 1}
                            </h3>
                            <p className={`text-sm ${classInfo.color}`}>
                                {classInfo.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Confidence Score */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800">Confidence Score</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold text-gray-800">
                                        {(anomalyData.confidence * 100).toFixed(1)}%
                                    </span>
                                    <span className={`text-sm font-medium ${severity.color}`}>
                                        ({severity.level} Confidence)
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${anomalyData.confidence * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Coordinates */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Pixel Coordinates</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Top-Left</p>
                                <p className="font-mono text-sm">
                                    ({Math.round(x1)}, {Math.round(y1)})
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Bottom-Right</p>
                                <p className="font-mono text-sm">
                                    ({Math.round(x2)}, {Math.round(y2)})
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Center</p>
                                <p className="font-mono text-sm">
                                    ({Math.round((x1 + x2) / 2)}, {Math.round((y1 + y2) / 2)})
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Area</p>
                                <p className="font-mono text-sm">
                                    {Math.round(area)} px²
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dimensions */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Anomaly Dimensions</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 mb-1">Width</p>
                                <p className="font-mono text-sm text-blue-800">
                                    {Math.round(width)} pixels
                                </p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 mb-1">Height</p>
                                <p className="font-mono text-sm text-blue-800">
                                    {Math.round(height)} pixels
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Details */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Analysis Details</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Detection Class:</span>
                                <span className={`text-sm font-medium ${classInfo.color}`}>
                                    {classInfo.name}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Class ID:</span>
                                <span className="text-sm font-mono">
                                    {anomalyData.class}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Severity Score:</span>
                                <span className={`text-sm font-medium ${severity.color}`}>
                                    {severity.level}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-600">Anomaly Index:</span>
                                <span className="text-sm font-mono">
                                    #{anomalyIndex + 1}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnomalyMetadataModal;