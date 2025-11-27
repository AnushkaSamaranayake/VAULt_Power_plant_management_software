import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Image, Eye, Trash2, Upload, X, AlertCircle } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import Footer from '../components/Footer';

const ThermalInspectionForm = () => {
    const { inspectionNo } = useParams();
    const navigate = useNavigate();
    const [inspection, setInspection] = useState(null);
    const [transformer, setTransformer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBaselineModal, setShowBaselineModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedWeather, setSelectedWeather] = useState('sunny');
    const [uploadError, setUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form data state
    const [formData, setFormData] = useState({
        dateOfInspection: new Date().toISOString().split('T')[0],
        timeOfInspection: new Date().toTimeString().slice(0, 5),
        inspectedBy: ''
    });

    useEffect(() => {
        fetchInspectionData();
    }, [inspectionNo]);

    const fetchInspectionData = async () => {
        try {
            setLoading(true);
            const inspectionResponse = await axios.get(`http://localhost:8080/api/inspections/${inspectionNo}`);
            setInspection(inspectionResponse.data);

            // Fetch transformer data
            if (inspectionResponse.data.transformerNo) {
                const transformerResponse = await axios.get(`http://localhost:8080/api/transformers/${inspectionResponse.data.transformerNo}`);
                setTransformer(transformerResponse.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load inspection details");
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleBaselineUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('weather', selectedWeather);

        try {
            const response = await axios.post(
                `http://localhost:8080/api/transformers/${inspection.transformerNo}/baseline-image`,
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

            if (response.data) {
                setTransformer(response.data);
                // Refresh inspection data
                await fetchInspectionData();
            }

            setTimeout(() => {
                setShowBaselineModal(false);
                setIsUploading(false);
            }, 1000);

        } catch (error) {
            console.error('Error uploading baseline image:', error);
            setUploadError(error.response?.data || 'Failed to upload baseline image. Please try again.');
            setIsUploading(false);
        }
    };

    const handleDeleteBaselineImage = async () => {
        if (!window.confirm('Are you sure you want to delete the baseline image?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:8080/api/transformers/${inspection.transformerNo}/baseline-image`
            );

            if (response.data) {
                setTransformer(response.data);
            }
        } catch (error) {
            console.error('Error deleting baseline image:', error);
            alert('Failed to delete baseline image. Please try again.');
        }
    };

    const handleViewBaselineImage = () => {
        if (transformer?.baselineImagePath) {
            setCurrentImageUrl(`http://localhost:8080/api/transformers/images/${transformer.baselineImagePath}`);
            setShowImageModal(true);
        }
    };

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return (
            <>
                <NavigationBar />
                <div className="flex justify-center items-center min-h-screen" style={{ marginTop: '80px' }}>
                    <div className="text-lg">Loading inspection form...</div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !inspection) {
        return (
            <>
                <NavigationBar />
                <div className="flex justify-center items-center min-h-screen" style={{ marginTop: '80px' }}>
                    <div className="text-red-600 text-lg">{error || "Inspection not found"}</div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <NavigationBar />
            <div className='flex flex-col m-10 min-h-screen' style={{ marginTop: '80px' }}>
                {/* Header with Back Button */}
                <div className='flex items-center gap-4 mb-6'>
                    <button 
                        onClick={() => navigate(`/inspections/${inspectionNo}`)}
                        className='flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors'
                    >
                        <ArrowLeft className='w-5 h-5' />
                        Back to Inspection
                    </button>
                </div>

                {/* Title */}
                <div className='mb-10'>
                    <h1 className='text-3xl font-bold text-blue-900'>Thermal Image Inspection Form</h1>
                </div>

                {/* Inspection Details Tile */}
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <div className='flex flex-col justify-between p-2'>
                        <div className='flex flex-row justify-between items-center mb-6'>
                            <div className='flex flex-col items-start'>
                                <h1 className='text-xl font-semibold'>{inspection?.inspectionNo}</h1>
                                <p className='text-xs text-gray-500'>
                                    <span>Transformer last inspected on: </span>
                                    {inspection?.dateOfInspectionAndTime || 'N/A'}
                                </p>
                            </div>
                            <div className='flex flex-row items-center space-x-4'>
                                <p className='text-xs text-gray-500'>
                                    <span>Last updated on: </span>
                                    {formatDateTime(inspection?.lastUpdated).split(',')[1]?.trim() || 'N/A'}
                                </p>
                                <div className='px-4 py-1 text-center text-xs font-medium rounded-full w-fit border-green-400 bg-green-300 text-green-800'>
                                    Inspection in Progress
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-row justify-between items-center'>
                            <div className='grid grid-cols-4 gap-4'>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{inspection?.transformerNo || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Transformer No</p>
                                </div>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{transformer?.poleNo || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Pole No</p>
                                </div>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{inspection?.branch || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Branch</p>
                                </div>
                                <div className='border rounded-xl py-2 px-4 flex flex-col items-center bg-indigo-200 shadow-md'>
                                    <h2 className='text-md font-semibold'>{inspection?.inspecBy || 'N/A'}</h2>
                                    <p className='text-xs text-gray-700'>Inspected By</p>
                                </div>
                            </div>
                            <div className='grid grid-cols-1 w-100% h-10'>
                                <div className='border rounded-xl py-2 px-4 flex flex-row justify-center items-center bg-indigo-200 shadow-md'>
                                    <Image 
                                        className="text-gray-700 cursor-pointer hover:text-gray-900" 
                                        onClick={() => setShowBaselineModal(true)}
                                        title="Upload Baseline Image"
                                    />
                                    <p className='ml-2 text-xs text-gray-900 text-center'>Baseline Image</p>
                                    {transformer?.baselineImagePath && (
                                        <>
                                            <Eye 
                                                className='mx-2 text-blue-600 hover:text-blue-800 cursor-pointer' 
                                                onClick={handleViewBaselineImage}
                                                title="View Baseline Image"
                                            />
                                            <Trash2 
                                                className='text-red-500 hover:text-red-700 cursor-pointer' 
                                                onClick={handleDeleteBaselineImage}
                                                title="Delete Baseline Image"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Baseline Image Upload Modal */}
                {showBaselineModal && (
                    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
                        <div className='bg-white p-6 rounded-lg shadow-xl w-96'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold'>
                                    {transformer?.baselineImagePath ? 'Update Baseline Image' : 'Upload Baseline Image'}
                                </h3>
                                <button
                                    onClick={() => setShowBaselineModal(false)}
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

                            {transformer?.baselineImagePath && (
                                <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded'>
                                    <p className='text-sm text-blue-800'>
                                        <span className='font-medium'>Current baseline image:</span> Uploaded on {' '}
                                        {transformer.baselineImageUploadDateAndTime ? 
                                            new Date(transformer.baselineImageUploadDateAndTime).toLocaleDateString() : 
                                            'Unknown date'
                                        }
                                    </p>
                                    {transformer.weather && (
                                        <p className='text-xs text-blue-600 mt-1'>
                                            Weather: {transformer.weather}
                                        </p>
                                    )}
                                </div>
                            )}

                            <form>
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
                                    <label className='flex items-center justify-center px-4 py-3 bg-green-500 text-white text-sm rounded-lg cursor-pointer hover:bg-green-600 transition-colors duration-200'>
                                        <Upload className='w-4 h-4 mr-2' />
                                        {isUploading ? 'Uploading...' : 'Select Baseline Image'}
                                        <input 
                                            type="file" 
                                            accept="image/jpeg,image/png,image/gif" 
                                            onChange={handleBaselineUpload} 
                                            className='hidden'
                                            disabled={isUploading}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Supported formats: JPG, PNG, GIF (Max: 10MB)
                                    </p>
                                </div>

                                {isUploading && (
                                    <div className='mb-4'>
                                        <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                                            <div 
                                                className='bg-green-500 h-4 transition-all duration-200'
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className='text-right text-gray-500 text-sm mt-1'>{uploadProgress}%</p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {/* Image View Modal */}
                {showImageModal && currentImageUrl && (
                    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50'>
                        <div className='relative max-w-6xl max-h-full p-4'>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className='absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all duration-200'
                            >
                                <X className='w-6 h-6' />
                            </button>
                            <img 
                                src={currentImageUrl} 
                                alt="Baseline Thermal Image" 
                                className='max-w-full max-h-full object-contain rounded-lg'
                            />
                        </div>
                    </div>
                )}

                {/* Form Content Area */}
                <div className='bg-white rounded-md shadow-md p-6'>
                    <form className='space-y-6'>
                        {/* Section 1: Basic Information */}
                        <div className='space-y-4'>
                            {/* First Row: Branch, Transformer No, Pole No */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Branch
                                    </label>
                                    <input
                                        type='text'
                                        value={inspection?.branch || ''}
                                        disabled
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Transformer No.
                                    </label>
                                    <input
                                        type='text'
                                        value={inspection?.transformerNo || ''}
                                        disabled
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Pole No.
                                    </label>
                                    <input
                                        type='text'
                                        value={transformer?.poleNo || ''}
                                        disabled
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                    />
                                </div>
                            </div>

                            {/* Second Row: Location Details */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Location Details
                                </label>
                                <input
                                    type='text'
                                    value={transformer?.location || ''}
                                    disabled
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed'
                                />
                            </div>

                            {/* Third Row: Date of Inspection, Time, Inspected By */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Date of Inspection
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type='date'
                                            name='dateOfInspection'
                                            value={formData.dateOfInspection}
                                            onChange={handleFormInputChange}
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Time
                                    </label>
                                    <input
                                        type='time'
                                        name='timeOfInspection'
                                        value={formData.timeOfInspection}
                                        onChange={handleFormInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Inspected By
                                    </label>
                                    <input
                                        type='text'
                                        name='inspectedBy'
                                        value={formData.inspectedBy}
                                        onChange={handleFormInputChange}
                                        placeholder='Inspector ID'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ThermalInspectionForm;
