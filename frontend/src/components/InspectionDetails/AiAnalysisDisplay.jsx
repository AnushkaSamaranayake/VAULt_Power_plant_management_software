import React, { useState, useEffect, useRef } from 'react';
import { Brain, AlertCircle, CheckCircle, Clock, RefreshCw, Settings, ChevronDown, ChevronUp, Download } from 'lucide-react';
import axios from 'axios';
import EditBoundingBoxesPopup from './EditBoundingBoxesPopup';

const AiAnalysisDisplay = ({ inspection, onRefresh, showOnlyStatus = false, showOnlyImage = false, showOnlyDetails = false }) => {
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [showBoxes, setShowBoxes] = useState(true);
    const [confidence, setConfidence] = useState(0.50);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [expandedErrors, setExpandedErrors] = useState([]);
    const imageRef = useRef(null);
    const canvasRef = useRef(null);

    const toggleErrorExpansion = (index) => {
        setExpandedErrors(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    // Fetch effective bounding boxes (AI + edited + added - deleted) when inspection changes
    useEffect(() => {
        const fetchEffectiveBoxes = async () => {
            if (inspection?.inspectionNo) {
                try {
                    const response = await axios.get(`http://localhost:8080/api/inspections/${inspection.inspectionNo}/effective-boxes`);
                    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                    setBoundingBoxes((data && Array.isArray(data.predictions)) ? data.predictions : []);
                } catch (error) {
                    console.error('Failed to fetch effective bounding boxes:', error);
                    // Fallback to parsing ai_bounding_boxes
                    if (inspection?.aiBoundingBoxes) {
                        try {
                            const parsed = JSON.parse(inspection.aiBoundingBoxes);
                            setBoundingBoxes(parsed.predictions || []);
                        } catch (e) {
                            console.error('Failed to parse AI bounding boxes:', e);
                            setBoundingBoxes([]);
                        }
                    } else {
                        setBoundingBoxes([]);
                    }
                }
            } else {
                setBoundingBoxes([]);
            }
        };
        
        fetchEffectiveBoxes();
    }, [inspection?.inspectionNo, inspection?.aiBoundingBoxes, inspection?.editedOrManuallyAddedBoxes, inspection?.deletedBoundingBoxes]);
    
    // Helper function to check AI status from state field
    const getAiStatus = () => {
        if (!inspection?.state) return null;
        const state = inspection.state.toLowerCase();
        if (state.includes('ai analysis pending') || state === 'pending') return 'pending';
        if (state.includes('ai analysis completed') || state === 'completed') return 'completed';
        if (state.includes('ai analysis failed') || state === 'failed') return 'failed';
        return null;
    };

    // Draw bounding boxes on canvas and keep in sync with layout changes
    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) return;

        const doDraw = () => drawBoundingBoxes();

        if (image.complete) {
            doDraw();
        } else {
            image.onload = doDraw;
        }

        // Observe size changes of the image element
        const ro = new ResizeObserver(() => doDraw());
        try { ro.observe(image); } catch (_) {}

        const onWindowResize = () => doDraw();
        window.addEventListener('resize', onWindowResize);

        return () => {
            try { ro.disconnect(); } catch (_) {}
            window.removeEventListener('resize', onWindowResize);
        };
    }, [showBoxes, boundingBoxes]);

    const drawBoundingBoxes = () => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Get sizes; bail if not ready
        const displayedWidth = image.clientWidth || image.width;
        const displayedHeight = image.clientHeight || image.height;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        if (!displayedWidth || !displayedHeight || !naturalWidth || !naturalHeight) return;

        // Calculate scaling ratios
        const scaleX = displayedWidth / naturalWidth;
        const scaleY = displayedHeight / naturalHeight;

        // Set canvas size to match displayed image size
        canvas.width = displayedWidth;
        canvas.height = displayedHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!showBoxes) return;

        // Draw each bounding box
        boundingBoxes.forEach((prediction, index) => {
            const [x1, y1, x2, y2] = prediction.box;
            
            // Scale coordinates to match displayed image size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledX2 = x2 * scaleX;
            const scaledY2 = y2 * scaleY;
            const width = scaledX2 - scaledX1;
            const height = scaledY2 - scaledY1;

            // Color based on class
            let color;
            switch (prediction.class) {
                case 0:
                    color = '#ef4444'; // Red - Faulty
                    break;
                case 1:
                    color = '#10b981'; // Green - Normal
                    break;
                case 2:
                    color = '#f59e0b'; // Orange - Potentially Faulty
                    break;
                default:
                    color = '#6b7280'; // Gray
            }

            // Draw rectangle
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(scaledX1, scaledY1, width, height);

            // Draw error number badge in top-left corner
            const errorNumber = `${index + 1}`;
            ctx.font = 'bold 14px Arial';
            const textMetrics = ctx.measureText(errorNumber);
            const badgeSize = 24;
            
            // Draw circular badge background
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(scaledX1 + badgeSize/2, scaledY1 + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
            ctx.fill();

            // Draw error number
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(errorNumber, scaledX1 + badgeSize/2, scaledY1 + badgeSize/2);
            
            // Reset text alignment
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
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

    const handleSaveCallback = async () => {
        // Refresh inspection data to get updated bounding boxes
        await onRefresh();
    };

    // Open edit popup with effective boxes
    const handleEditBoundingBoxes = () => {
        setShowEditPopup(true);
    };

    // Generate and download a change log as a text file
    const handleExportChangeLog = () => {
        try {
            const lines = [];
            const headerDate = inspection?.maintenanceImageUploadDateAndTime
                ? new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : '';

            const safeStr = (v) => (v === undefined || v === null) ? '' : String(v);
            const fmtBox = (box) => box && box.length === 4
                ? `X1: ${box[0].toFixed(2)}, Y1: ${box[1].toFixed(2)}, X2: ${box[2].toFixed(2)}, Y2: ${box[3].toFixed(2)} (W: ${(box[2]-box[0]).toFixed(2)}px, H: ${(box[3]-box[1]).toFixed(2)}px)`
                : '';

            lines.push(`Transformer: ${safeStr(inspection?.transformerNo)}`);
            lines.push(`Inspection #: ${safeStr(inspection?.inspectionNo)}`);
            if (headerDate) lines.push(`AI Analysis Date: ${headerDate}`);
            lines.push('');
            lines.push(`Detections (${boundingBoxes.length})`);
            lines.push('');

            const classNameOf = (c) => c === 0 ? 'Faulty' : (c === 1 ? 'Normal' : 'Potentially Faulty');

            boundingBoxes.forEach((pred, idx) => {
                lines.push(`Error ${idx + 1} - ${classNameOf(pred.class)} - Confidence: ${(pred.confidence * 100).toFixed(1)}%`);

                // User annotation entry
                if (pred.type && pred.type !== 'ai') {
                    const who = pred.userId ? String(pred.userId) : 'user';
                    const when = pred.timestamp ? new Date(pred.timestamp).toLocaleString() : '';
                    const note = pred.comment ? String(pred.comment) : '';
                    lines.push(`  ${String(pred.type).toUpperCase()} by ${who}${when ? ` @ ${when}` : ''}`);
                    if (note) lines.push(`  Note: ${note}`);
                    if (pred.originalBox) lines.push(`  Original Box: ${fmtBox(pred.originalBox)}`);
                    if (pred.box) lines.push(`  ${pred.type === 'added' ? 'Added' : 'Edited'} Box: ${fmtBox(pred.box)}`);
                }

                // AI detection entry (only for AI origin or edited-from-AI)
                if ((!pred.type || pred.type === 'ai') || (pred.type === 'edited' && pred.originalBox)) {
                    const aiBox = (pred.type === 'edited' && pred.originalBox) ? pred.originalBox : pred.box;
                    lines.push('  Detected by AI');
                    if (aiBox) lines.push(`  AI Box: ${fmtBox(aiBox)}`);
                }

                lines.push('');
            });

            // Include deleted boxes if present on inspection
            try {
                if (inspection?.deletedBoundingBoxes) {
                    const del = typeof inspection.deletedBoundingBoxes === 'string' ? JSON.parse(inspection.deletedBoundingBoxes) : inspection.deletedBoundingBoxes;
                    if (Array.isArray(del) && del.length) {
                        lines.push('Deleted Boxes');
                        del.forEach((d, i) => {
                            const note = d?.comment ? String(d.comment) : '';
                            const who = d?.userId ? String(d.userId) : 'user';
                            const when = d?.timestamp ? new Date(d.timestamp).toLocaleString() : '';
                            lines.push(`  ${i + 1}. Deleted by ${who}${when ? ` @ ${when}` : ''}`);
                            if (note) lines.push(`     Note: ${note}`);
                            if (d?.box) lines.push(`     Box: ${fmtBox(d.box)}`);
                        });
                        lines.push('');
                    }
                }
            } catch (_) { /* ignore parse issues for export */ }

            const content = lines.join('\n');
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const filename = `inspection-${safeStr(inspection?.inspectionNo)}-change-log.txt`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export change log:', err);
        }
    };

    if (!inspection?.maintenanceImagePath) {
        return null;
    }

    // Render only AI Analysis Status
    if (showOnlyStatus) {
        return (
            <>
                <style>{`
                    .confidence-slider::-webkit-slider-thumb {
                        appearance: none;
                        height: 20px;
                        width: 20px;
                        border-radius: 50%;
                        background: #3B82F6;
                        cursor: pointer;
                        border: 2px solid #FFFFFF;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .confidence-slider::-moz-range-thumb {
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
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
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
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer confidence-slider"
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
            </>
        );
    }

    // Render only Analysis Image
    if (showOnlyImage) {
        return (
            <>
                {getAiStatus() === 'completed' && (
                    <div className="space-y-3">
                        <div className="relative rounded-lg border shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-white border-b">
                                <h3 className="text-sm font-semibold text-gray-700">Analysis Image</h3>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center space-x-1 cursor-pointer text-xs">
                                        <input
                                            type="checkbox"
                                            checked={showBoxes}
                                            onChange={(e) => setShowBoxes(e.target.checked)}
                                            className="w-3 h-3 text-blue-600 rounded"
                                        />
                                        <span className="text-gray-600">Show Boxes</span>
                                    </label>
                                    <button
                                        onClick={handleEditBoundingBoxes}
                                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                                    >
                                        Edit Bounding Boxes
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <img
                                    ref={imageRef}
                                    src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                                    alt="AI Analysis"
                                    className="w-full h-auto object-contain block"
                                    onLoad={drawBoundingBoxes}
                                    crossOrigin="anonymous"
                                    style={{ maxHeight: '420px' }}
                                />
                                {boundingBoxes.length > 0 && (
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute top-0 left-0 pointer-events-none"
                                        style={{ display: showBoxes ? 'block' : 'none' }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Analysis Summary Info - below image */}
                        {boundingBoxes.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Brain className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {boundingBoxes.length} anomal{boundingBoxes.length !== 1 ? 'ies' : 'y'} detected
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                View analysis in the comparison view above
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleExportChangeLog}
                                            className="px-3 py-2 bg-white text-blue-700 border border-blue-300 text-xs rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                            title="Export change log as text"
                                        >
                                            <Download className="w-4 h-4" />
                                            Export Change Log
                                        </button>
                                        <button
                                            onClick={handleEditBoundingBoxes}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Edit Bounding Boxes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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

                {/* Edit Bounding Boxes Popup */}
                {showEditPopup && (
                    <EditBoundingBoxesPopup
                        inspection={inspection}
                        boundingBoxes={boundingBoxes}
                        onClose={() => setShowEditPopup(false)}
                        onSave={onRefresh}
                    />
                )}
            </>
        );
    }

    // Render only Detection Details
    if (showOnlyDetails) {
        return (
            <>
                {/* Analysis Summary */}
                {getAiStatus() === 'completed' && boundingBoxes.length > 0 && (
                    <>
                        {/* Detection Details */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-gray-700">Detection Details:</h3>
                            {boundingBoxes.map((pred, idx) => {
                                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                                const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                                const bgColor = pred.class === 0 ? 'bg-red-600' : pred.class === 1 ? 'bg-green-600' : 'bg-orange-600';
                                const isExpanded = expandedErrors.includes(idx);
                                
                                return (
                                    <div key={idx} className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                                        {/* Main Error Row */}
                                        <div 
                                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleErrorExpansion(idx)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                                    Error {idx + 1}
                                                </span>
                                                <span className={`font-medium ${colorClass} text-sm`}>{className}</span>
                                                {/* Show type badge and note hint inline for visibility */}
                                                {pred.type && pred.type !== 'ai' && (
                                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">
                                                        {String(pred.type).toUpperCase()}
                                                    </span>
                                                )}
                                                {pred.comment && (
                                                    <span className="ml-1 text-[11px] text-gray-500">📝</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 text-sm">
                                                    Confidence: {(pred.confidence * 100).toFixed(1)}%
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Change Log */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200 bg-white p-3">
                                                <h4 className="text-xs font-semibold text-gray-700 mb-2">Change Log (Latest First):</h4>
                                                <div className="space-y-2">
                                                    {/* Annotation from edits/additions if present */}
                                                    {(pred.type && pred.type !== 'ai') && (
                                                        <div className="flex items-start gap-2 text-xs">
                                                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 flex-shrink-0"></div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium text-gray-700">
                                                                        {String(pred.type).toUpperCase()} by {pred.userId ? String(pred.userId) : 'user'}
                                                                    </span>
                                                                    {pred.timestamp && (
                                                                        <span className="text-gray-500">
                                                                            {new Date(pred.timestamp).toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {pred.comment && (
                                                                    <p className="text-gray-600 mt-1">{pred.comment}</p>
                                                                )}
                                                                {pred.originalBox && (
                                                                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                        <p className="font-medium text-gray-700 mb-1">Original Box Coordinates:</p>
                                                                        <p className="text-gray-600">
                                                                            X1: {pred.originalBox[0].toFixed(2)}, Y1: {pred.originalBox[1].toFixed(2)}, X2: {pred.originalBox[2].toFixed(2)}, Y2: {pred.originalBox[3].toFixed(2)}
                                                                        </p>
                                                                        <p className="text-gray-500 mt-1">
                                                                            Width: {(pred.originalBox[2] - pred.originalBox[0]).toFixed(2)}px, Height: {(pred.originalBox[3] - pred.originalBox[1]).toFixed(2)}px
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {/* Show the resulting box for edited/added entries */}
                                                                {pred.box && (
                                                                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                        <p className="font-medium text-gray-700 mb-1">{pred.type === 'added' ? 'Added Box Coordinates:' : 'Edited Box Coordinates:'}</p>
                                                                        <p className="text-gray-600">
                                                                            X1: {pred.box[0].toFixed(2)}, Y1: {pred.box[1].toFixed(2)}, X2: {pred.box[2].toFixed(2)}, Y2: {pred.box[3].toFixed(2)}
                                                                        </p>
                                                                        <p className="text-gray-500 mt-1">
                                                                            Width: {(pred.box[2] - pred.box[0]).toFixed(2)}px, Height: {(pred.box[3] - pred.box[1]).toFixed(2)}px
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Placeholder for future entries - these will appear above */}
                                                    {/* Future modifications will be inserted here at the top */}
                                                    
                                                    {/* AI Detection Entry - only for AI-origin or edited-from-AI */}
                                                    {(!pred.type || pred.type === 'ai' || (pred.type === 'edited' && pred.originalBox)) && (
                                                        <div className="flex items-start gap-2 text-xs">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium text-gray-700">
                                                                        Detected by AI
                                                                    </span>
                                                                    <span className="text-gray-500">
                                                                        {(() => {
                                                                            const dt = inspection?.maintenanceImageUploadDateAndTime;
                                                                            const d = dt ? new Date(dt) : null;
                                                                            return (d && !isNaN(d)) ? d.toLocaleDateString('en-US', {
                                                                                year: 'numeric', month: 'short', day: 'numeric'
                                                                            }) : '';
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-600 mt-1">
                                                                    AI analysis identified this as <span className={colorClass}>{className}</span> with {(pred.confidence * 100).toFixed(1)}% confidence
                                                                </p>
                                                                {(() => {
                                                                    const aiBox = (pred.type === 'edited' && pred.originalBox) ? pred.originalBox : pred.box;
                                                                    if (!aiBox) return null;
                                                                    return (
                                                                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                            <p className="font-medium text-gray-700 mb-1">Bounding Box Coordinates:</p>
                                                                            <p className="text-gray-600">
                                                                                X1: {aiBox[0].toFixed(2)}, Y1: {aiBox[1].toFixed(2)}, X2: {aiBox[2].toFixed(2)}, Y2: {aiBox[3].toFixed(2)}
                                                                            </p>
                                                                            <p className="text-gray-500 mt-1">
                                                                                Width: {(aiBox[2] - aiBox[0]).toFixed(2)}px, Height: {(aiBox[3] - aiBox[1]).toFixed(2)}px
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Edit Bounding Boxes Popup */}
                {showEditPopup && (
                    <EditBoundingBoxesPopup
                        inspection={inspection}
                        boundingBoxes={boundingBoxes}
                        onClose={() => setShowEditPopup(false)}
                        onSave={onRefresh}
                    />
                )}
            </>
        );
    }

    // Default: Render all sections (original behavior for backward compatibility)
    return (
        <div className="ai-analysis-section mt-6 space-y-4">
            <style>{`
                .confidence-slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #3B82F6;
                    cursor: pointer;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .confidence-slider::-moz-range-thumb {
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
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer confidence-slider"
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

            {/* Analysis Image with Overlay (merged effective boxes) */}
            {getAiStatus() === 'completed' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Analysis Image</h3>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center space-x-1 cursor-pointer text-xs">
                                <input
                                    type="checkbox"
                                    checked={showBoxes}
                                    onChange={(e) => setShowBoxes(e.target.checked)}
                                    className="w-3 h-3 text-blue-600 rounded"
                                />
                                <span className="text-gray-600">Show Boxes</span>
                            </label>
                            <button
                                onClick={handleEditBoundingBoxes}
                                className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                            >
                                Edit Bounding Boxes
                            </button>
                        </div>
                    </div>
                    <div className="relative rounded-lg border shadow-sm overflow-hidden">
                        <img
                            ref={imageRef}
                            src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                            alt="AI Analysis"
                            className="w-full h-auto object-contain block"
                            onLoad={drawBoundingBoxes}
                            crossOrigin="anonymous"
                            style={{ maxHeight: '420px' }}
                        />
                        {boundingBoxes.length > 0 && (
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 pointer-events-none"
                                style={{ display: showBoxes ? 'block' : 'none' }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Analysis Summary */}
            {getAiStatus() === 'completed' && boundingBoxes.length > 0 && (
                <>
                    {/* Summary Info */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Brain className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">
                                    {boundingBoxes.length} anomal{boundingBoxes.length !== 1 ? 'ies' : 'y'} detected
                                </p>
                                <p className="text-xs text-blue-700">
                                    View analysis in the comparison view above
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportChangeLog}
                                className="px-3 py-2 bg-white text-blue-700 border border-blue-300 text-sm rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                                title="Export change log as text"
                            >
                                <Download className="w-4 h-4" />
                                Export Change Log
                            </button>
                            <button
                                onClick={handleEditBoundingBoxes}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Edit Bounding Boxes
                            </button>
                        </div>
                    </div>

                    {/* Detection Details */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700">Detection Details:</h3>
                        {boundingBoxes.map((pred, idx) => {
                            const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                            const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                            const bgColor = pred.class === 0 ? 'bg-red-600' : pred.class === 1 ? 'bg-green-600' : 'bg-orange-600';
                            const isExpanded = expandedErrors.includes(idx);
                            
                            return (
                                <div key={idx} className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                                    {/* Main Error Row */}
                                    <div 
                                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => toggleErrorExpansion(idx)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                                Error {idx + 1}
                                            </span>
                                            <span className={`font-medium ${colorClass} text-sm`}>{className}</span>
                                            {/* Show type badge and note hint inline for visibility */}
                                            {pred.type && pred.type !== 'ai' && (
                                                <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">
                                                    {String(pred.type).toUpperCase()}
                                                </span>
                                            )}
                                            {pred.comment && (
                                                <span className="ml-1 text-[11px] text-gray-500">📝</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600 text-sm">
                                                Confidence: {(pred.confidence * 100).toFixed(1)}%
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Expanded Change Log */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 bg-white p-3">
                                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Change Log (Latest First):</h4>
                                            <div className="space-y-2">
                                                {/* Annotation from edits/additions if present */}
                                                {(pred.type && pred.type !== 'ai') && (
                                                    <div className="flex items-start gap-2 text-xs">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 flex-shrink-0"></div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-gray-700">
                                                                    {String(pred.type).toUpperCase()} by {pred.userId ? String(pred.userId) : 'user'}
                                                                </span>
                                                                {pred.timestamp && (
                                                                    <span className="text-gray-500">
                                                                        {new Date(pred.timestamp).toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {pred.comment && (
                                                                <p className="text-gray-600 mt-1">{pred.comment}</p>
                                                            )}
                                                            {pred.originalBox && (
                                                                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                    <p className="font-medium text-gray-700 mb-1">Original Box Coordinates:</p>
                                                                    <p className="text-gray-600">
                                                                        X1: {pred.originalBox[0].toFixed(2)}, Y1: {pred.originalBox[1].toFixed(2)}, X2: {pred.originalBox[2].toFixed(2)}, Y2: {pred.originalBox[3].toFixed(2)}
                                                                    </p>
                                                                    <p className="text-gray-500 mt-1">
                                                                        Width: {(pred.originalBox[2] - pred.originalBox[0]).toFixed(2)}px, Height: {(pred.originalBox[3] - pred.originalBox[1]).toFixed(2)}px
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {/* Show the resulting box for edited/added entries */}
                                                            {pred.box && (
                                                                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                    <p className="font-medium text-gray-700 mb-1">{pred.type === 'added' ? 'Added Box Coordinates:' : 'Edited Box Coordinates:'}</p>
                                                                    <p className="text-gray-600">
                                                                        X1: {pred.box[0].toFixed(2)}, Y1: {pred.box[1].toFixed(2)}, X2: {pred.box[2].toFixed(2)}, Y2: {pred.box[3].toFixed(2)}
                                                                    </p>
                                                                    <p className="text-gray-500 mt-1">
                                                                        Width: {(pred.box[2] - pred.box[0]).toFixed(2)}px, Height: {(pred.box[3] - pred.box[1]).toFixed(2)}px
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Placeholder for future entries - these will appear above */}
                                                {/* Future modifications will be inserted here at the top */}
                                                
                                                {/* AI Detection Entry - only for AI-origin or edited-from-AI */}
                                                {(!pred.type || pred.type === 'ai' || (pred.type === 'edited' && pred.originalBox)) && (
                                                    <div className="flex items-start gap-2 text-xs">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-gray-700">
                                                                    Detected by AI
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    {(() => {
                                                                        const dt = inspection?.maintenanceImageUploadDateAndTime;
                                                                        const d = dt ? new Date(dt) : null;
                                                                        return (d && !isNaN(d)) ? d.toLocaleDateString('en-US', {
                                                                            year: 'numeric', month: 'short', day: 'numeric'
                                                                        }) : '';
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-600 mt-1">
                                                                AI analysis identified this as <span className={colorClass}>{className}</span> with {(pred.confidence * 100).toFixed(1)}% confidence
                                                            </p>
                                                            {(() => {
                                                                const aiBox = (pred.type === 'edited' && pred.originalBox) ? pred.originalBox : pred.box;
                                                                if (!aiBox) return null;
                                                                return (
                                                                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                        <p className="font-medium text-gray-700 mb-1">Bounding Box Coordinates:</p>
                                                                        <p className="text-gray-600">
                                                                            X1: {aiBox[0].toFixed(2)}, Y1: {aiBox[1].toFixed(2)}, X2: {aiBox[2].toFixed(2)}, Y2: {aiBox[3].toFixed(2)}
                                                                        </p>
                                                                        <p className="text-gray-500 mt-1">
                                                                            Width: {(aiBox[2] - aiBox[0]).toFixed(2)}px, Height: {(aiBox[3] - aiBox[1]).toFixed(2)}px
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
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

            {/* Edit Bounding Boxes Popup */}
            {showEditPopup && (
                <EditBoundingBoxesPopup
                    inspection={inspection}
                    boundingBoxes={boundingBoxes} // Always pass merged effective boxes
                    onClose={() => setShowEditPopup(false)}
                    onSave={onRefresh}
                />
            )}
        </div>
    );
};

export default AiAnalysisDisplay;
