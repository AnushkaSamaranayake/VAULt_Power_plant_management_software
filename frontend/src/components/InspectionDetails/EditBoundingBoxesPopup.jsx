import React, { useRef, useEffect, useState } from 'react';

const EditBoundingBoxesPopup = ({ inspection, boundingBoxes, onClose }) => {
    const imageRef = useRef(null);
    const canvasRef = useRef(null);
    const [visibleBoxes, setVisibleBoxes] = useState(() => 
        boundingBoxes.map((_, idx) => idx) // Initially all boxes visible
    );

    // Draw bounding boxes when component mounts or data changes
    useEffect(() => {
        if (boundingBoxes.length > 0 && imageRef.current && canvasRef.current) {
            const image = imageRef.current;
            
            if (image.complete) {
                drawBoundingBoxes();
            } else {
                image.onload = drawBoundingBoxes;
            }
        }
    }, [boundingBoxes, visibleBoxes]);

    const toggleBoxVisibility = (index) => {
        setVisibleBoxes(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const drawBoundingBoxes = () => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Get the displayed size of the image
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;

        // Calculate scaling ratios
        const scaleX = displayedWidth / naturalWidth;
        const scaleY = displayedHeight / naturalHeight;

        // Set canvas size to match displayed image size
        canvas.width = displayedWidth;
        canvas.height = displayedHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each bounding box (only if visible)
        boundingBoxes.forEach((prediction, index) => {
            // Skip if this box is not visible
            if (!visibleBoxes.includes(index)) return;

            const [x1, y1, x2, y2] = prediction.box;
            
            // Scale coordinates to match displayed image size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledX2 = x2 * scaleX;
            const scaledY2 = y2 * scaleY;
            const width = scaledX2 - scaledX1;
            const height = scaledY2 - scaledY1;

            // Color based on class
            let color, label;
            switch (prediction.class) {
                case 0:
                    color = '#ef4444'; // Red - Faulty
                    label = 'Faulty';
                    break;
                case 1:
                    color = '#10b981'; // Green - Normal
                    label = 'Normal';
                    break;
                case 2:
                    color = '#f59e0b'; // Orange - Potentially Faulty
                    label = 'Potentially Faulty';
                    break;
                default:
                    color = '#6b7280'; // Gray
                    label = 'Unknown';
            }

            // Draw rectangle
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(scaledX1, scaledY1, width, height);

            // Draw label background
            const labelText = `${label} (${(prediction.confidence * 100).toFixed(1)}%)`;
            ctx.font = 'bold 16px Arial';
            const textMetrics = ctx.measureText(labelText);
            const textHeight = 20;
            
            ctx.fillStyle = color;
            ctx.fillRect(scaledX1, scaledY1 - textHeight - 4, textMetrics.width + 8, textHeight + 4);

            // Draw label text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, scaledX1 + 4, scaledY1 - 6);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative z-50">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
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
                    {/* Image Section with Canvas Overlay */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-4">AI Analysis Image</h3>
                        <div className="bg-gray-100 border rounded-lg flex items-center justify-center p-4 overflow-hidden">
                            <div className="relative inline-block max-w-full">
                                <img
                                    ref={imageRef}
                                    src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                                    alt="Thermal Analysis - Edit Mode"
                                    className="max-w-full h-auto block"
                                    crossOrigin="anonymous"
                                    onLoad={drawBoundingBoxes}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 pointer-events-none"
                                />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Click and drag on the image to create or modify bounding boxes
                        </p>
                    </div>

                    {/* Detection Details Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-4">
                            Detected Anomalies ({boundingBoxes.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {boundingBoxes.map((pred, idx) => {
                                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                                const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                                const bgClass = pred.class === 0 ? 'bg-red-50' : pred.class === 1 ? 'bg-green-50' : 'bg-orange-50';
                                const isVisible = visibleBoxes.includes(idx);
                                
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-3 ${bgClass} rounded-lg border ${!isVisible ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center space-x-3 flex-1">
                                            {/* Visibility Checkbox */}
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isVisible}
                                                    onChange={() => toggleBoxVisibility(idx)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                            </label>
                                            
                                            <div className="flex-1">
                                                <span className={`font-medium ${colorClass}`}>
                                                    Anomaly {idx + 1}: {className}
                                                </span>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Confidence: {(pred.confidence * 100).toFixed(1)}%
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Box: [{pred.box.map(v => v.toFixed(0)).join(', ')}]
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                                                Edit
                                            </button>
                                            <button className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-sm rounded hover:bg-red-200">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
