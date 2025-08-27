import React from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Image, Eye, Trash2, Upload, X, AlertCircle } from 'lucide-react'
import axios from 'axios'

const Head = ({ transformer, onTransformerUpdate }) => {

    const { transformerNo } = useParams();

    const [time, setTime] = useState(new Date());
    const [showBaselineModal, setShowBaselineModal] = useState(false);
    const [showImageViewModal, setShowImageViewModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedWeather, setSelectedWeather] = useState('sunny');
    const [uploadError, setUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
            const interval = setInterval(() => {
                setTime(new Date());
            }, 60000);
    
            return () => clearInterval(interval);
            }, []);

    const handleBaselineImageUpload = async (event) => {
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
                `http://localhost:8080/api/transformers/${transformerNo}/baseline-image`,
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

            if (response.data && onTransformerUpdate) {
                onTransformerUpdate(response.data);
            }

            setTimeout(() => {
                setShowUploadModal(false);
                setShowBaselineModal(false);
                setIsUploading(false);
            }, 1000);

        } catch (error) {
            console.error('Error uploading baseline image:', error);
            setUploadError(error.response?.data || 'Failed to upload image. Please try again.');
            setIsUploading(false);
            setTimeout(() => {
                setShowUploadModal(false);
            }, 2000);
        }
    };

    const handleDeleteBaselineImage = async () => {
        if (!window.confirm('Are you sure you want to delete the baseline image?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:8080/api/transformers/${transformerNo}/baseline-image`
            );

            if (response.data && onTransformerUpdate) {
                onTransformerUpdate(response.data);
            }
        } catch (error) {
            console.error('Error deleting baseline image:', error);
            alert('Failed to delete baseline image. Please try again.');
        }
    };

    const handleViewImage = () => {
        if (transformer?.baselineImagePath) {
            setShowImageViewModal(true);
        }
    };

    return (
        <div className='flex flex-col justify-between p-2'>
            <div className='flex flex-row justify-between items-center mb-3'>
                <div className='flex flex-col'>
                    <h1 className='text-2xl font-bold text-blue-900'>{transformer?.transformerNo || 'Loading...'}</h1>
                    <p className='text-sm text-gray-600'>{transformer?.locationDetails || 'Loading...'}</p>
                    <p className='text-xs text-gray-500'><span>Region: </span>{transformer?.region || 'Loading...'}</p>
                </div>
                <div className='flex flex-row items-center space-x-4'>
                    <p className='text-xs text-gray-500'><span>Last updated on: </span>{time.toLocaleTimeString()}</p>
                </div>
            </div>
            <div className='flex flex-row justify-between items-center'>
                <div className='grid grid-cols-4 gap-4'>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.poleNo || '...'}</h2>
                        <p className='text-xs text-gray-700'>Pole No</p>
                    </div>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.capacity || '...'}</h2>
                        <p className='text-xs text-gray-700'>Capacity</p>
                    </div>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.type || '...'}</h2>
                        <p className='text-xs text-gray-700'>Type</p>
                    </div>
                    <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                        <h2 className='text-md font-semibold'>{transformer?.numberOfFeeders || '...'}</h2>
                        <p className='text-xs text-gray-700'>No. of Feeders</p>
                    </div>
                </div>
                <div className='grid grid-cols-1 w-100% h-10'>
                    <div className='border rounded-xl py-2 px-4 flex flex-row justify-center items-center bg-indigo-200 shadow-md'>
                        <Image 
                            className="text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                            onClick={() => setShowBaselineModal(true)}
                            title="Upload Baseline Image"
                        />
                        <p className='ml-2 text-xs text-gray-900 text-center'>Baseline Image</p>
                        {transformer?.baselineImagePath && (
                            <Eye 
                                className='mx-2 text-gray-700 hover:text-gray-900 cursor-pointer transition-colors' 
                                onClick={handleViewImage}
                                title="View Baseline Image"
                            />
                        )}
                        {transformer?.baselineImagePath && (
                            <Trash2 
                                className='text-red-500 hover:text-red-700 cursor-pointer transition-colors' 
                                onClick={handleDeleteBaselineImage}
                                title="Delete Baseline Image"
                            />
                        )}
                    </div>
                </div>
            </div> 

            {/* Baseline Image Upload Modal */}
            {showBaselineModal && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-xl w-96'>
                        <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-semibold'>Upload Baseline Image</h3>
                            <button
                                onClick={() => setShowBaselineModal(false)}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <X className='w-6 h-6' />
                            </button>
                        </div>
                        
                        <div className='mb-6'>
                            <p className='text-sm text-gray-700 mb-4'>
                                Upload a baseline thermal image of transformer {transformer?.transformerNo}.
                            </p>
                            
                            <div className='mb-4'>
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
                                <label className='flex items-center justify-center px-4 py-3 bg-green-500 text-white text-sm rounded-lg cursor-pointer hover:bg-green-600 transition-colors duration-200'>
                                    <Upload className='w-4 h-4 mr-2' />
                                    {isUploading ? 'Uploading...' : 'Select Baseline Image'}
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/png,image/gif" 
                                        onChange={handleBaselineImageUpload} 
                                        className='hidden'
                                        disabled={isUploading}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Supported formats: JPG, PNG, GIF (Max: 10MB)
                                </p>
                            </div>

                            {transformer?.baselineImagePath && (
                                <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                                    <p className='text-sm text-green-800'>
                                        <span className='font-medium'>Current baseline image:</span> Uploaded
                                    </p>
                                    {transformer.weather && (
                                        <p className='text-xs text-green-600'>
                                            Weather: {transformer.weather}
                                        </p>
                                    )}
                                </div>
                            )}
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
                                {uploadError ? 'Upload Failed' : 'Uploading Baseline Image...'}
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
                                        className='bg-green-500 h-4 transition-all duration-200'
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
            {showImageViewModal && transformer?.baselineImagePath && (
                <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50'>
                    <div className='relative max-w-4xl max-h-full p-4'>
                        <button
                            onClick={() => setShowImageViewModal(false)}
                            className='absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all duration-200'
                        >
                            <X className='w-6 h-6' />
                        </button>
                        <img 
                            src={`http://localhost:8080/api/transformers/images/${transformer.baselineImagePath}`} 
                            alt="Baseline Thermal Image" 
                            className='max-w-full max-h-full object-contain rounded-lg'
                        />
                        <div className='absolute bottom-4 left-4 bg-black bg-opacity-60 text-white p-3 rounded-lg'>
                            <p className='text-sm font-medium'>Baseline Image - {transformer.transformerNo}</p>
                            {transformer.weather && (
                                <p className='text-xs'>Weather: {transformer.weather}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Head;
