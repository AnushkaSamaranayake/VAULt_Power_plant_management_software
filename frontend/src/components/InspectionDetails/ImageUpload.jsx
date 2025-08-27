import React from 'react'
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Upload, Eye, Trash2, X, AlertCircle } from 'lucide-react';

const ImageUpload = ({ inspection, onInspectionUpdate }) => {

    const { inspectionNo } = useParams();

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedWeather, setSelectedWeather] = useState('sunny');
    const [uploadError, setUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

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

            if (response.data && onInspectionUpdate) {
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
                        <label className='flex items-center justify-center px-4 py-3 bg-blue-500 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-600 transition-colors duration-200'>
                            <Upload className='w-4 h-4 mr-2' />
                            {isUploading ? 'Uploading...' : 'Upload Maintenance Image'}
                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,image/gif" 
                                onChange={handleFileUpload} 
                                className='hidden'
                                disabled={isUploading}
                            />
                        </label>
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

            {/* Image Display Section */}
            {inspection?.maintenanceImagePath && (
                <div className='flex flex-col bg-white w-2/3 shadow-md rounded-md p-6'>
                    <div className='flex flex-row items-center justify-between mb-6'>
                        <h1 className='font-semibold text-md'>Thermal Image Analysis</h1>
                        <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(inspection?.status)}`}>
                            {inspection?.status}
                        </div>
                    </div>
                    
                    <div className='flex justify-center'>
                        <div className='relative group'>
                            <img 
                                src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`} 
                                alt="Maintenance Thermal Inspection" 
                                className='max-w-full max-h-96 object-contain rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200'
                                onClick={() => handleViewImage(`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`)}
                            />
                            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center'>
                                <Eye className='w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                            </div>
                        </div>
                    </div>
                    
                    <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
                        <div className='p-3 bg-gray-50 rounded-lg'>
                            <p className='font-medium text-gray-700'>Upload Date</p>
                            <p className='text-gray-600'>
                                {inspection.maintenanceImageUploadDateAndTime ? 
                                    new Date(inspection.maintenanceImageUploadDateAndTime).toLocaleDateString() :
                                    'N/A'
                                }
                            </p>
                        </div>
                        <div className='p-3 bg-gray-50 rounded-lg'>
                            <p className='font-medium text-gray-700'>Weather Conditions</p>
                            <p className='text-gray-600 capitalize'>{inspection.weather || 'N/A'}</p>
                        </div>
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
