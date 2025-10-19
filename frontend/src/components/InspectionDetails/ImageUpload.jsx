import React from 'react'
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Upload, Eye, Trash2, X, AlertCircle } from 'lucide-react';

const ImageUpload = ({ inspection, onInspectionUpdate }) => {

    const { inspectionNo } = useParams();

    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedWeather, setSelectedWeather] = useState('sunny');
    const [uploadError, setUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [transformer, setTransformer] = useState(null);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [showBoxes, setShowBoxes] = useState(true);
    const imageRef = React.useRef(null);
    const canvasRef = React.useRef(null);

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
        if (!image || !canvas) return;
        
        const ctx = canvas.getContext('2d');

        // Get the actual displayed dimensions of the image
        const rect = image.getBoundingClientRect();
        const displayedWidth = image.offsetWidth;
        const displayedHeight = image.offsetHeight;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;

        // Calculate scaling ratios
        const scaleX = displayedWidth / naturalWidth;
        const scaleY = displayedHeight / naturalHeight;

        // Set canvas size to match displayed image size exactly
        canvas.width = displayedWidth;
        canvas.height = displayedHeight;
        
        // Position canvas to match image position
        canvas.style.width = displayedWidth + 'px';
        canvas.style.height = displayedHeight + 'px';

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

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return "border-red-400 bg-red-300 text-red-800 ";
            case "In progress":
                return "border-blue-400 bg-blue-300 text-blue-800";
            case "Completed":
                return "border-green-400 bg-green-300 text-green-800";
            default:
                return "border-gray-400 bg-gray-300 text-gray-800";
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);
        setShowUploadModal(true);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('weather', selectedWeather);
        formData.append('confidence', '0.50'); // Default confidence for initial upload

        try {
            const response = await axios.post(
                `http://localhost:8080/api/inspections/${inspectionNo}/maintenance-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            console.log('Image upload response:', response.data);
            if (response.data && onInspectionUpdate) {
                console.log('Updating inspection with new data:', response.data);
                onInspectionUpdate(response.data);
            }

            setTimeout(() => {
                setShowUploadModal(false);
                setIsUploading(false);
            }, 1000);

        } catch (error) {
            console.error('Error uploading image:', error);
            setUploadError('Failed to upload image. Please try again.');
            setIsUploading(false);
            setTimeout(() => {
                setShowUploadModal(false);
            }, 2000);
        }
    };

    const handleDeleteImage = async () => {
        if (!window.confirm('Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:8080/api/inspections/${inspectionNo}/maintenance-image`
            );

            if (response.data && onInspectionUpdate) {
                onInspectionUpdate(response.data);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image. Please try again.');
        }
    };

    const handleViewImage = (imageUrl) => {
        setCurrentImageUrl(imageUrl);
        setShowImageModal(true);
    };

    const handleBaselineUpload = async (file) => {
        if (!file || !transformer) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);
        setShowUploadModal(true);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('weather', selectedWeather);

        try {
            const response = await axios.post(
                `http://localhost:8080/api/transformers/${transformer.transformerNo}/baseline-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            console.log('Baseline upload response:', response.data);
            if (response.data) {
                setTransformer(response.data);
            }

            setTimeout(() => {
                setShowUploadModal(false);
                setIsUploading(false);
            }, 1000);

        } catch (error) {
            console.error('Error uploading baseline image:', error);
            setUploadError('Failed to upload baseline image. Please try again.');
            setIsUploading(false);
            setTimeout(() => {
                setShowUploadModal(false);
            }, 2000);
        }
    };

    return (
        <div className='flex flex-row items-start justify-between space-x-6'>
            {/* Upload Section */}
            <div className='flex flex-col bg-white w-1/3 shadow-md rounded-md p-6'>
                <div className='flex flex-row items-center justify-between mb-6'>
                    <h1 className='font-semibold text-md'>Maintenance Image Upload</h1>
                    <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection?.status)}`}>
                        {inspection?.status}
                    </div>
                </div>
                <p className='text-sm text-gray-700 mb-6'>Upload a thermal image for maintenance inspection.</p>

                <form>
                    <div className='mb-6'>
                        <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-2">
                            Weather Condition <span className="text-red-500">*</span>
                        </label>
                        <select 
                            name="weather" 
                            id="weather" 
                            value={selectedWeather}
                            onChange={(e) => setSelectedWeather(e.target.value)}
                            className='border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        >
                            <option value="sunny">Sunny</option>
                            <option value="cloudy">Cloudy</option>
                            <option value="rainy">Rainy</option>
                            <option value="snowy">Snowy</option>
                            <option value="windy">Windy</option>
                            <option value="foggy">Foggy</option>
                        </select>
                    </div>
                    <div className='mb-4'>
                        <button
                            type="button"
                            onClick={() => setShowMaintenanceModal(true)}
                            className='flex items-center justify-center px-4 py-3 bg-blue-500 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-600 transition-colors duration-200 w-full'
                        >
                            <Upload className='w-4 h-4 mr-2' />
                            {inspection?.maintenanceImagePath ? 'Update Maintenance Image' : 'Upload Maintenance Image'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            Supported formats: JPG, PNG, GIF (Max: 10MB)
                        </p>
                    </div>
                </form>

                {/* Progress Section */}
                {inspection?.maintenanceImagePath && (
                    <div className='mt-6 pt-6 border-t border-gray-200'>
                        <h2 className='font-semibold text-md mb-4'>Current Image</h2>
                        <div className='flex flex-col space-y-3'>
                            <div className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg'>
                                <div className='flex items-center space-x-3'>
                                    <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                                        <Upload className='w-4 h-4 text-green-600' />
                                    </div>
                                    <div>
                                        <p className='text-sm font-medium text-green-800'>Image uploaded</p>
                                        <p className='text-xs text-green-600'>
                                            {inspection.maintenanceImageUploadDateAndTime ? 
                                                new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleString() :
                                                'Recently uploaded'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <button
                                        type="button"
                                        onClick={() => handleViewImage(`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`)}
                                        className='p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200'
                                        title="View Image"
                                    >
                                        <Eye className='w-4 h-4' />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteImage}
                                        className='p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200'
                                        title="Delete Image"
                                    >
                                        <Trash2 className='w-4 h-4' />
                                    </button>
                                </div>
                            </div>
                            
                            {inspection.weather && (
                                <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                    <p className='text-sm text-blue-800'>
                                        <span className='font-medium'>Weather:</span> {inspection.weather}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Image Display Section - Side by Side Comparison */}
            <div className='flex flex-col bg-white w-2/3 shadow-md rounded-md p-6'>
                <div className='flex flex-row items-center justify-between mb-6'>
                    <h1 className='font-semibold text-md'>Thermal Image Analysis</h1>
                    <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection?.status)}`}>
                        {inspection?.status}
                    </div>
                </div>
                
                {/* Side-by-Side Image Display */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
                    {/* Current Inspection Image with AI Analysis */}
                    <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <h3 className='text-sm font-semibold text-gray-700'>
                                Current Inspection {getAiStatus() === 'completed' && boundingBoxes.length > 0 && '(AI Analysis)'}
                            </h3>
                            {getAiStatus() === 'completed' && boundingBoxes.length > 0 && (
                                <label className="flex items-center space-x-1 cursor-pointer text-xs">
                                    <input
                                        type="checkbox"
                                        checked={showBoxes}
                                        onChange={(e) => setShowBoxes(e.target.checked)}
                                        className="w-3 h-3 text-blue-600 rounded"
                                    />
                                    <span className="text-gray-600">Show Boxes</span>
                                </label>
                            )}
                        </div>
                        {inspection?.maintenanceImagePath ? (
                            <div className='relative group rounded-lg border shadow-sm overflow-hidden' style={{ display: 'inline-block', width: '100%' }}>
                                <div className='relative' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <img 
                                        ref={imageRef}
                                        src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`} 
                                        alt="Current Inspection Image" 
                                        className='max-w-full h-auto max-h-80 object-contain block cursor-pointer hover:opacity-90 transition-opacity duration-200'
                                        onClick={() => handleViewImage(`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`)}
                                        onLoad={drawBoundingBoxes}
                                        crossOrigin="anonymous"
                                        style={{ display: 'block' }}
                                    />
                                    {getAiStatus() === 'completed' && boundingBoxes.length > 0 && (
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute pointer-events-none"
                                            style={{ 
                                                display: showBoxes ? 'block' : 'none',
                                                top: 0,
                                                left: '50%',
                                                transform: 'translateX(-50%)'
                                            }}
                                        />
                                    )}
                                </div>
                                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center pointer-events-none'>
                                    <Eye className='w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                </div>
                            </div>
                        ) : (
                            <div 
                                className='w-full h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all duration-200 cursor-pointer'
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0) {
                                        const file = files[0];
                                        if (file.type.startsWith('image/')) {
                                            const syntheticEvent = {
                                                target: {
                                                    files: [file]
                                                }
                                            };
                                            handleFileUpload(syntheticEvent);
                                        }
                                    }
                                }}
                                onClick={() => setShowMaintenanceModal(true)}
                            >
                                <div className='text-center text-gray-500'>
                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                    <p className='text-sm font-medium'>Drop maintenance image here</p>
                                    <p className='text-xs'>or click to browse</p>
                                    <p className='text-xs mt-1 text-gray-400'>JPG, PNG, GIF (Max: 10MB)</p>
                                </div>
                            </div>
                        )}
                        <div className='text-xs text-gray-500'>
                            {inspection?.maintenanceImageUploadDateAndTime ? 
                                `Uploaded: ${new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleDateString()}` :
                                'No image uploaded'
                            }
                            {inspection?.weather && ` • Weather: ${inspection.weather}`}
                        </div>
                    </div>

                    {/* Baseline Reference Image */}
                    <div className='space-y-2'>
                        <h3 className='text-sm font-semibold text-gray-700'>Baseline Reference</h3>
                        {transformer?.baselineImagePath ? (
                            <div className='relative group'>
                                <img 
                                    src={`http://localhost:8080/api/transformers/images/${transformer.baselineImagePath}`} 
                                    alt="Baseline Reference Image" 
                                    className='w-full h-auto max-h-80 object-contain rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200'
                                    onClick={() => handleViewImage(`http://localhost:8080/api/transformers/images/${transformer.baselineImagePath}`)}
                                />
                                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center'>
                                    <Eye className='w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                </div>
                            </div>
                        ) : (
                            <div 
                                className='w-full h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-orange-400 transition-all duration-200 cursor-pointer'
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-orange-500', 'bg-orange-50');
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
                                    const files = e.dataTransfer.files;
                                    if (files.length > 0) {
                                        const file = files[0];
                                        if (file.type.startsWith('image/')) {
                                            handleBaselineUpload(file);
                                        }
                                    }
                                }}
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/jpeg,image/png,image/gif';
                                    input.onchange = (e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleBaselineUpload(e.target.files[0]);
                                        }
                                    };
                                    input.click();
                                }}
                            >
                                <div className='text-center text-gray-500'>
                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                    <p className='text-sm font-medium'>Drop baseline image here</p>
                                    <p className='text-xs'>or click to browse</p>
                                    <p className='text-xs mt-1 text-gray-400'>JPG, PNG, GIF (Max: 10MB)</p>
                                </div>
                            </div>
                        )}
                        <div className='text-xs text-gray-500'>
                            {transformer?.baselineImageUploadDateAndTime ? 
                                `Captured: ${new Date(transformer.baselineImageUploadDateAndTime).toLocaleDateString()}` :
                                'Baseline not set'
                            }
                            {transformer?.weather && ` • Weather: ${transformer.weather}`}
                        </div>
                    </div>
                </div>
                
                {/* Metadata Grid */}
                <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='p-3 bg-gray-50 rounded-lg'>
                        <p className='font-medium text-gray-700'>Inspection Date</p>
                        <p className='text-gray-600'>
                            {inspection?.maintenanceImageUploadDateAndTime ? 
                                new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleDateString() :
                                'N/A'
                            }
                        </p>
                    </div>
                    <div className='p-3 bg-gray-50 rounded-lg'>
                        <p className='font-medium text-gray-700'>Comparison Status</p>
                        <p className='text-gray-600'>
                            {inspection?.maintenanceImagePath && transformer?.baselineImagePath ? 
                                <span className='text-green-600'>✓ Ready for comparison</span> :
                                inspection?.maintenanceImagePath ? 
                                <span className='text-orange-600'>⚠ No baseline available</span> :
                                <span className='text-gray-600'>⊘ No images available</span>
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Maintenance Image Upload Modal */}
            {showMaintenanceModal && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-xl w-96'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-semibold'>
                                {inspection?.maintenanceImagePath ? 'Update Maintenance Image' : 'Upload Maintenance Image'}
                            </h3>
                            <button
                                onClick={() => setShowMaintenanceModal(false)}
                                className='p-1 hover:bg-gray-100 rounded'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        {uploadError ? (
                            <div className='mb-4 p-3 bg-red-100 border border-red-200 rounded text-red-700 text-sm'>
                                <AlertCircle className='w-4 h-4 inline mr-2' />
                                {uploadError}
                            </div>
                        ) : null}

                        {inspection?.maintenanceImagePath && (
                            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded'>
                                <p className='text-sm text-blue-800'>
                                    <span className='font-medium'>Current maintenance image:</span> Uploaded on {' '}
                                    {inspection.maintenanceImageUploadDateAndTime ? 
                                        new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleDateString() : 
                                        'Unknown date'
                                    }
                                </p>
                                {inspection.weather && (
                                    <p className='text-xs text-blue-600 mt-1'>
                                        Weather: {inspection.weather}
                                    </p>
                                )}
                            </div>
                        )}

                        <form>
                            <div className='mb-4'>
                                <label htmlFor="maintenance-weather" className="block text-sm font-medium text-gray-700 mb-2">
                                    Weather Condition <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    name="weather" 
                                    id="maintenance-weather" 
                                    value={selectedWeather}
                                    onChange={(e) => setSelectedWeather(e.target.value)}
                                    className='border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    disabled={isUploading}
                                >
                                    <option value="sunny">Sunny</option>
                                    <option value="cloudy">Cloudy</option>
                                    <option value="rainy">Rainy</option>
                                    <option value="snowy">Snowy</option>
                                    <option value="windy">Windy</option>
                                    <option value="foggy">Foggy</option>
                                </select>
                            </div>

                            <div className='mb-4'>
                                <label className='flex items-center justify-center px-4 py-3 bg-blue-500 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-600 transition-colors duration-200'>
                                    <Upload className='w-4 h-4 mr-2' />
                                    {isUploading ? 'Uploading...' : 'Select Maintenance Image'}
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/png,image/gif" 
                                        onChange={(e) => {
                                            handleFileUpload(e);
                                            setShowMaintenanceModal(false);
                                        }} 
                                        className='hidden'
                                        disabled={isUploading}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Supported formats: JPG, PNG, GIF (Max: 10MB)
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Progress Modal */}
            {showUploadModal && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-xl w-96'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-semibold'>
                                {uploadError ? 'Upload Failed' : 'Uploading Image...'}
                            </h3>
                            {uploadError && (
                                <AlertCircle className='w-5 h-5 text-red-500' />
                            )}
                        </div>
                        
                        {uploadError ? (
                            <div className='text-red-600 text-sm mb-4'>
                                {uploadError}
                            </div>
                        ) : (
                            <>
                                <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2'>
                                    <div 
                                        className='bg-blue-500 h-4 transition-all duration-200'
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className='text-right text-gray-500 text-sm'>{uploadProgress}%</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Image View Modal */}
            {showImageModal && currentImageUrl && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50'>
                    <div className='relative max-w-4xl max-h-full p-4'>
                        <button
                            onClick={() => setShowImageModal(false)}
                            className='absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all duration-200'
                        >
                            <X className='w-6 h-6' />
                        </button>
                        <img 
                            src={currentImageUrl} 
                            alt="Full Size Thermal Image" 
                            className='max-w-full max-h-full object-contain rounded-lg'
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ImageUpload
