import React, { useRef, useEffect, useState } from 'react';

const EditBoundingBoxesPopup = ({ inspection, boundingBoxes, onClose }) => {
    const imageRef = useRef(null);
    const canvasRef = useRef(null);
    const [visibleBoxes, setVisibleBoxes] = useState(() => 
        boundingBoxes.map((_, idx) => idx) // Initially all boxes visible
    );
    const [editingBoxIndex, setEditingBoxIndex] = useState(null);
    const [editedBoxes, setEditedBoxes] = useState(boundingBoxes);
    const [draggingCorner, setDraggingCorner] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Draw bounding boxes when component mounts or data changes
    useEffect(() => {
        if (editedBoxes.length > 0 && imageRef.current && canvasRef.current) {
            const image = imageRef.current;
            
            if (image.complete) {
                drawBoundingBoxes();
            } else {
                image.onload = drawBoundingBoxes;
            }
        }
    }, [editedBoxes, visibleBoxes, editingBoxIndex]);

    const toggleBoxVisibility = (index) => {
        setVisibleBoxes(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const toggleEditMode = (index) => {
        if (editingBoxIndex === index) {
            setEditingBoxIndex(null);
        } else {
            setEditingBoxIndex(index);
        }
    };

    const getCornerPosition = (corner, box, scaleX, scaleY) => {
        const [x1, y1, x2, y2] = box;
        switch (corner) {
            case 'tl': return { x: x1 * scaleX, y: y1 * scaleY };
            case 'tr': return { x: x2 * scaleX, y: y1 * scaleY };
            case 'bl': return { x: x1 * scaleX, y: y2 * scaleY };
            case 'br': return { x: x2 * scaleX, y: y2 * scaleY };
            default: return { x: 0, y: 0 };
        }
    };

    const isNearCorner = (mouseX, mouseY, cornerX, cornerY, threshold = 10) => {
        const dx = mouseX - cornerX;
        const dy = mouseY - cornerY;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
    };

    const handleCanvasMouseDown = (e) => {
        if (editingBoxIndex === null) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const image = imageRef.current;
        const scaleX = canvas.width / image.naturalWidth;
        const scaleY = canvas.height / image.naturalHeight;

        const box = editedBoxes[editingBoxIndex].box;
        const corners = ['tl', 'tr', 'bl', 'br'];

        for (const corner of corners) {
            const pos = getCornerPosition(corner, box, scaleX, scaleY);
            if (isNearCorner(mouseX, mouseY, pos.x, pos.y)) {
                setDraggingCorner(corner);
                setIsDragging(true);
                return;
            }
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (!isDragging || draggingCorner === null || editingBoxIndex === null) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const image = imageRef.current;
        const scaleX = canvas.width / image.naturalWidth;
        const scaleY = canvas.height / image.naturalHeight;

        // Convert mouse position to image coordinates
        const imgX = mouseX / scaleX;
        const imgY = mouseY / scaleY;

        setEditedBoxes(prev => {
            const newBoxes = [...prev];
            const [x1, y1, x2, y2] = newBoxes[editingBoxIndex].box;

            let newBox;
            switch (draggingCorner) {
                case 'tl':
                    newBox = [imgX, imgY, x2, y2];
                    break;
                case 'tr':
                    newBox = [x1, imgY, imgX, y2];
                    break;
                case 'bl':
                    newBox = [imgX, y1, x2, imgY];
                    break;
                case 'br':
                    newBox = [x1, y1, imgX, imgY];
                    break;
                default:
                    newBox = [x1, y1, x2, y2];
            }

            // Ensure coordinates are in correct order (x1 < x2, y1 < y2)
            const normalizedBox = [
                Math.min(newBox[0], newBox[2]),
                Math.min(newBox[1], newBox[3]),
                Math.max(newBox[0], newBox[2]),
                Math.max(newBox[1], newBox[3])
            ];

            newBoxes[editingBoxIndex] = {
                ...newBoxes[editingBoxIndex],
                box: normalizedBox
            };

            return newBoxes;
        });
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(false);
        setDraggingCorner(null);
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
        editedBoxes.forEach((prediction, index) => {
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
            ctx.lineWidth = index === editingBoxIndex ? 4 : 3;
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

            // Draw corner handles if in edit mode
            if (index === editingBoxIndex) {
                const cornerRadius = 6;
                const corners = [
                    { x: scaledX1, y: scaledY1 }, // top-left
                    { x: scaledX2, y: scaledY1 }, // top-right
                    { x: scaledX1, y: scaledY2 }, // bottom-left
                    { x: scaledX2, y: scaledY2 }  // bottom-right
                ];

                corners.forEach(corner => {
                    // Outer circle (white border)
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(corner.x, corner.y, cornerRadius + 1, 0, 2 * Math.PI);
                    ctx.fill();

                    // Inner circle (gray)
                    ctx.fillStyle = '#6b7280';
                    ctx.beginPath();
                    ctx.arc(corner.x, corner.y, cornerRadius, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
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
                        {editingBoxIndex !== null && (
                            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                ✏️ Editing mode active for Anomaly {editingBoxIndex + 1}. Drag the corner handles to resize the box.
                            </div>
                        )}
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
                                    className="absolute top-0 left-0"
                                    style={{ cursor: editingBoxIndex !== null ? 'crosshair' : 'default' }}
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {editingBoxIndex !== null 
                                ? 'Drag the gray corner handles to resize the bounding box'
                                : 'Click "Edit" on an anomaly to enable drag-to-resize mode'
                            }
                        </p>
                    </div>

                    {/* Detection Details Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-4">
                            Detected Anomalies ({editedBoxes.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {editedBoxes.map((pred, idx) => {
                                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                                const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                                const bgClass = pred.class === 0 ? 'bg-red-50' : pred.class === 1 ? 'bg-green-50' : 'bg-orange-50';
                                const isVisible = visibleBoxes.includes(idx);
                                const isEditing = editingBoxIndex === idx;
                                
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-3 ${bgClass} rounded-lg border ${!isVisible ? 'opacity-50' : ''} ${isEditing ? 'ring-2 ring-blue-500' : ''}`}>
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
                                                    {isEditing && <span className="ml-2 text-xs text-blue-600">(Editing)</span>}
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
                                            <button 
                                                onClick={() => toggleEditMode(idx)}
                                                className={`px-3 py-1 border text-sm rounded transition-colors ${
                                                    isEditing 
                                                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {isEditing ? '✓ Done' : 'Edit'}
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
