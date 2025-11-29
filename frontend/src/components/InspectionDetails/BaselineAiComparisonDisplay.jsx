import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import InteractiveImageViewer from '../common/InteractiveImageViewer';
import InteractiveImageModal from '../common/InteractiveImageModal';
import BoundingBoxOverlay from '../common/BoundingBoxOverlay';
import AiAnalysisDisplay from './AiAnalysisDisplay';
import axios from 'axios';

const BaselineAiComparisonDisplay = ({ inspection, onRefresh }) => {
    const [transformer, setTransformer] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [currentImageTitle, setCurrentImageTitle] = useState('');

    // Fetch transformer data for baseline image
    useEffect(() => {
        if (inspection?.transformerNo) {
            const fetchTransformer = async () => {
                try {
                    const response = await axios.get(`http://localhost:8080/api/transformers/${inspection.transformerNo}`);
                    setTransformer(response.data);
                } catch (error) {
                    console.error('Failed to fetch transformer data:', error);
                    setTransformer(null);
                }
            };
            fetchTransformer();
        }
    }, [inspection?.transformerNo]);

    const handleViewImage = (imageUrl, title) => {
        setCurrentImageUrl(imageUrl);
        setCurrentImageTitle(title);
        setShowImageModal(true);
    };

    return (
        <div className="flex flex-col bg-white rounded-md shadow-md p-6 mt-10">
            <div className="flex flex-row items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Baseline vs AI Analysis Comparison</h2>
            </div>

            {/* AI Analysis Status - Full Width */}
            <div className="mb-6">
                <AiAnalysisDisplay 
                    inspection={inspection} 
                    onRefresh={onRefresh}
                    showOnlyStatus={true}
                />
            </div>

            {/* Side-by-Side Comparison - Swapped Order */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* AI Thermal Analysis - Now on the left */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">AI Thermal Analysis</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <AiAnalysisDisplay 
                            inspection={inspection} 
                            onRefresh={onRefresh}
                            showOnlyImage={true}
                        />
                    </div>
                </div>

                {/* Baseline Reference Image - Now on the right */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Baseline Reference</h3>
                    {transformer?.baselineImagePath ? (
                        <div className="space-y-3">
                            <div className="relative" style={{ height: '420px' }}>
                                <InteractiveImageViewer
                                    src={`http://localhost:8080/api/transformers/images/${transformer.baselineImagePath}`}
                                    alt="Baseline Reference Image"
                                    className="rounded-lg"
                                    containerClassName="w-full h-full border shadow-sm"
                                    showControls={true}
                                />
                                
                                {/* Full-screen button */}
                                <button
                                    onClick={() => handleViewImage(
                                        `http://localhost:8080/api/transformers/images/${transformer.baselineImagePath}`,
                                        'Baseline Reference Image'
                                    )}
                                    className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 shadow-lg transition-all duration-200"
                                    title="Open in full screen"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Baseline Image Info */}
                            <div className="grid grid-cols-1 gap-3 text-sm">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-700">Capture Date</p>
                                    <p className="text-gray-600">
                                        {transformer.baselineImageUploadDateAndTime ? 
                                            new Date(transformer.baselineImageUploadDateAndTime).toLocaleDateString() :
                                            'N/A'
                                        }
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-700">Weather Conditions</p>
                                    <p className="text-gray-600 capitalize">{transformer.weather || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50" style={{ height: '420px' }}>
                            <div className="text-center text-gray-500">
                                <div className="w-12 h-12 mx-auto mb-4 opacity-50 bg-gray-400 rounded-lg flex items-center justify-center">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium">No baseline image available</p>
                                <p className="text-xs">Upload a baseline image in the transformer details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detection Details - Full Width Below Images */}
            <div className="mt-6">
                <AiAnalysisDisplay 
                    inspection={inspection} 
                    onRefresh={onRefresh}
                    showOnlyDetails={true}
                />
            </div>

            {/* Interactive Image Modal */}
            {showImageModal && currentImageUrl && (
                <InteractiveImageModal
                    isOpen={showImageModal}
                    onClose={() => setShowImageModal(false)}
                    src={currentImageUrl}
                    alt={currentImageTitle}
                    title={currentImageTitle}
                />
            )}
        </div>
    );
};

export default BaselineAiComparisonDisplay;