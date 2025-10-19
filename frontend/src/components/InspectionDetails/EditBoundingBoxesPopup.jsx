import React from 'react';

const EditBoundingBoxesPopup = ({ inspection, boundingBoxes, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Edit Bounding Boxes</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Image Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-4">AI Analysis Image</h3>
                        <div className="bg-gray-100 border rounded-lg flex items-center justify-center p-4">
                            <img
                                src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                                alt="Thermal Analysis - Edit Mode"
                                className="max-w-full h-auto"
                                crossOrigin="anonymous"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Image editing functionality will be implemented here
                        </p>
                    </div>

                    {/* Detection Details Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-4">Detected Errors</h3>
                        <div className="space-y-2">
                            {boundingBoxes.map((pred, idx) => {
                                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                                const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                                const bgClass = pred.class === 0 ? 'bg-red-50' : pred.class === 1 ? 'bg-green-50' : 'bg-orange-50';
                                const bgColor = pred.class === 0 ? 'bg-red-600' : pred.class === 1 ? 'bg-green-600' : 'bg-orange-600';
                                
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-3 ${bgClass} rounded-lg border`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                                    Error {idx + 1}
                                                </span>
                                                <span className={`font-medium ${colorClass}`}>{className}</span>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                Confidence: {(pred.confidence * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                        <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                                            Edit
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            Bounding box editing functionality will be implemented here
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditBoundingBoxesPopup;
