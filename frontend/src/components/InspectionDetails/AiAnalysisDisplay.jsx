import React, { useState, useEffect, useRef } from 'react';
import { Brain, AlertCircle, CheckCircle, Clock, RefreshCw, Settings } from 'lucide-react';
import axios from 'axios';

const AiAnalysisDisplay = ({ inspection, onRefresh }) => {
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [showBoxes, setShowBoxes] = useState(true);
    const [confidence, setConfidence] = useState(0.50);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const imageRef = useRef(null);
    const canvasRef = useRef(null);

    // Parse bounding boxes when inspection data changes
    useEffect(() => {
        if (inspection?.aiBoundingBoxes) {
            try {
                const parsed = JSON.parse(inspection.aiBoundingBoxes);
                setBoundingBoxes(parsed.predictions || []);
            } catch (error) {
                console.error('Failed to parse AI bounding boxes:', error);
                setBoundingBoxes([]);
            }
        } else {
            setBoundingBoxes([]);
        }
    }, [inspection?.aiBoundingBoxes]);
    
    // Helper function to check AI status from state field
    const getAiStatus = () => {
        if (!inspection?.state) return null;
        const state = inspection.state.toLowerCase();
        if (state.includes('ai analysis pending') || state === 'pending') return 'pending';
        if (state.includes('ai analysis completed') || state === 'completed') return 'completed';
        if (state.includes('ai analysis failed') || state === 'failed') return 'failed';
        return null;
    };

    // Draw bounding boxes on canvas
    useEffect(() => {
        if (showBoxes && boundingBoxes.length > 0 && imageRef.current && canvasRef.current) {
            const image = imageRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Wait for image to load
            if (image.complete) {
                drawBoundingBoxes();
            } else {
                image.onload = drawBoundingBoxes;
            }
        }
    }, [showBoxes, boundingBoxes]);

    const drawBoundingBoxes = () => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to match image
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!showBoxes) return;

        // Draw each bounding box
        boundingBoxes.forEach((prediction) => {
            const [x1, y1, x2, y2] = prediction.box;
            const width = x2 - x1;
            const height = y2 - y1;

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
            ctx.strokeRect(x1, y1, width, height);

            // Draw label background
            const labelText = `${label} (${(prediction.confidence * 100).toFixed(1)}%)`;
            ctx.font = 'bold 16px Arial';
            const textMetrics = ctx.measureText(labelText);
            const textHeight = 20;
            
            ctx.fillStyle = color;
            ctx.fillRect(x1, y1 - textHeight - 4, textMetrics.width + 8, textHeight + 4);

            // Draw label text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, x1 + 4, y1 - 6);
        });
    };

    const getStatusIcon = () => {
        const aiStatus = getAiStatus();
        switch (aiStatus) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Brain className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusText = () => {
        const aiStatus = getAiStatus();
        switch (aiStatus) {
            case 'completed':
                return 'Analysis Complete';
            case 'pending':
                return 'Analyzing...';
            case 'failed':
                return 'Analysis Failed';
            default:
                return inspection?.state || 'Not Analyzed';
        }
    };

    const getStatusColor = () => {
        const aiStatus = getAiStatus();
        switch (aiStatus) {
            case 'completed':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'pending':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'failed':
                return 'bg-red-50 border-red-200 text-red-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    // Handle confidence change and re-analysis
    const handleConfidenceChange = async (newConfidence) => {
        if (isReanalyzing || getAiStatus() === 'pending') return;
        
        setConfidence(newConfidence);
        setIsReanalyzing(true);
        
        try {
            await axios.post(`http://localhost:8080/api/inspections/${inspection.inspectionNo}/reanalyze`, null, {
                params: { confidence: newConfidence }
            });
            
            // Wait a moment then refresh to show pending status
            setTimeout(() => {
                onRefresh();
                setIsReanalyzing(false);
            }, 500);
        } catch (error) {
            console.error('Failed to reanalyze image:', error);
            setIsReanalyzing(false);
        }
    };

    if (!inspection?.maintenanceImagePath) {
        return null;
    }

    return (
        <div className="mt-6 space-y-4">
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #3B82F6;
                    cursor: pointer;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #3B82F6;
                    cursor: pointer;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
            `}</style>
            {/* AI Analysis Status */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor()}`}>
                <div className="flex items-center space-x-3">
                    {getStatusIcon()}
                    <div>
                        <p className="font-semibold text-sm">AI Analysis Status</p>
                        <p className="text-xs">{getStatusText()}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {(getAiStatus() === 'completed' || getAiStatus() === 'failed') && (
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                            title="Analysis Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                    {getAiStatus() === 'pending' && (
                        <button
                            onClick={onRefresh}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Confidence Settings */}
            {showSettings && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">Analysis Settings</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">
                                Confidence Threshold: {(confidence * 100).toFixed(0)}%
                            </label>
                            <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-500">10%</span>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={confidence}
                                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    disabled={isReanalyzing || getAiStatus() === 'pending'}
                                />
                                <span className="text-xs text-gray-500">100%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Higher values detect only high-confidence anomalies. Lower values may detect more potential issues.
                            </p>
                        </div>
                        <button
                            onClick={() => handleConfidenceChange(confidence)}
                            disabled={isReanalyzing || getAiStatus() === 'pending'}
                            className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isReanalyzing ? 'Re-analyzing...' : 'Apply & Re-analyze'}
                        </button>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {getAiStatus() === 'completed' && boundingBoxes.length > 0 && (
                <>
                    {/* Image with Bounding Boxes */}
                    <div className="relative border rounded-lg overflow-hidden bg-gray-100">
                        <img
                            ref={imageRef}
                            src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                            alt="Thermal Analysis"
                            className="w-full h-auto"
                            crossOrigin="anonymous"
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{ display: showBoxes ? 'block' : 'none' }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showBoxes}
                                onChange={(e) => setShowBoxes(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Show Bounding Boxes</span>
                        </label>
                        <span className="text-sm text-gray-600">
                            {boundingBoxes.length} anomal{boundingBoxes.length !== 1 ? 'ies' : 'y'} detected
                        </span>
                    </div>

                    {/* Detection Details */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700">Detection Details:</h3>
                        {boundingBoxes.map((pred, idx) => {
                            const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                            const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                            
                            return (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <span className={`font-medium ${colorClass}`}>{className}</span>
                                    <span className="text-gray-600">
                                        Confidence: {(pred.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* No Detections Message */}
            {getAiStatus() === 'completed' && boundingBoxes.length === 0 && (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No anomalies detected in this image</p>
                </div>
            )}

            {/* Failed Message */}
            {getAiStatus() === 'failed' && (
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">AI analysis failed. Please try re-uploading the image.</p>
                </div>
            )}
        </div>
    );
};

export default AiAnalysisDisplay;
