import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Image, Eye, Trash2, Upload, X, AlertCircle, Brain } from 'lucide-react';
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

    // Bounding boxes and canvas refs
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const imageRef = useRef(null);
    const canvasRef = useRef(null);

    // Form data state
    const [formData, setFormData] = useState({
        dateOfInspection: new Date().toISOString().split('T')[0],
        timeOfInspection: new Date().toTimeString().slice(0, 5),
        inspectedBy: '',
        baselineImagingRight: '',
        baselineImagingLeft: '',
        baselineImagingFront: '',
        lastMonthKVA: '',
        lastMonthDate: '',
        lastMonthTime: '',
        currentMonthKVA: '',
        baselineCondition: '',
        transformerType: '',
        meterSerialNumber: '',
        meterCTRatio: '',
        meterMake: ''
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

            // Fetch effective bounding boxes
            if (inspectionResponse.data.inspectionNo) {
                try {
                    const boxesResponse = await axios.get(`http://localhost:8080/api/inspections/${inspectionResponse.data.inspectionNo}/effective-boxes`);
                    const data = typeof boxesResponse.data === 'string' ? JSON.parse(boxesResponse.data) : boxesResponse.data;
                    setBoundingBoxes((data && Array.isArray(data.predictions)) ? data.predictions : []);
                } catch (error) {
                    console.error('Failed to fetch bounding boxes:', error);
                    setBoundingBoxes([]);
                }
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



    // Draw bounding boxes on canvas
    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas || boundingBoxes.length === 0) return;

        const drawBoundingBoxes = () => {
            const ctx = canvas.getContext('2d');
            const displayedWidth = image.clientWidth || image.width;
            const displayedHeight = image.clientHeight || image.height;
            const naturalWidth = image.naturalWidth;
            const naturalHeight = image.naturalHeight;

            if (!displayedWidth || !displayedHeight || !naturalWidth || !naturalHeight) return;

            const scaleX = displayedWidth / naturalWidth;
            const scaleY = displayedHeight / naturalHeight;

            canvas.width = displayedWidth;
            canvas.height = displayedHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            boundingBoxes.forEach((prediction, index) => {
                const [x1, y1, x2, y2] = prediction.box;
                const scaledX1 = x1 * scaleX;
                const scaledY1 = y1 * scaleY;
                const scaledX2 = x2 * scaleX;
                const scaledY2 = y2 * scaleY;
                const width = scaledX2 - scaledX1;
                const height = scaledY2 - scaledY1;

                let color;
                switch (prediction.class) {
                    case 0: color = '#ef4444'; break; // Red - Faulty
                    case 1: color = '#10b981'; break; // Green - Normal
                    case 2: color = '#f59e0b'; break; // Orange - Potentially Faulty
                    default: color = '#6b7280'; // Gray
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.strokeRect(scaledX1, scaledY1, width, height);

                const errorNumber = `${index + 1}`;
                ctx.font = 'bold 14px Arial';
                const badgeSize = 24;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(scaledX1 + badgeSize/2, scaledY1 + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(errorNumber, scaledX1 + badgeSize/2, scaledY1 + badgeSize/2);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
            });
        };

        if (image.complete) {
            drawBoundingBoxes();
        } else {
            image.onload = drawBoundingBoxes;
        }

        const ro = new ResizeObserver(() => drawBoundingBoxes());
        try { ro.observe(image); } catch (_) {}

        window.addEventListener('resize', drawBoundingBoxes);

        return () => {
            try { ro.disconnect(); } catch (_) {}
            window.removeEventListener('resize', drawBoundingBoxes);
        };
    }, [boundingBoxes]);

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

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 2: Base Line Imaging nos (IR) */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Base Line Imaging nos (IR)</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Right
                                    </label>
                                    <input
                                        type='text'
                                        name='baselineImagingRight'
                                        value={formData.baselineImagingRight}
                                        onChange={handleFormInputChange}
                                        placeholder='Enter IR value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Left
                                    </label>
                                    <input
                                        type='text'
                                        name='baselineImagingLeft'
                                        value={formData.baselineImagingLeft}
                                        onChange={handleFormInputChange}
                                        placeholder='Enter IR value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Front
                                    </label>
                                    <input
                                        type='text'
                                        name='baselineImagingFront'
                                        value={formData.baselineImagingFront}
                                        onChange={handleFormInputChange}
                                        placeholder='Enter IR value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>

                            {/* AI Analysis Image with Bounding Boxes */}
                            {inspection?.maintenanceImagePath && (
                                <div className='mt-6 mx-auto' style={{ width: '60%' }}>
                                    <h4 className='text-sm font-medium text-gray-700 mb-3'>Thermal Analysis Image</h4>
                                    <div className='relative border border-gray-300 rounded-lg overflow-hidden shadow-sm'>
                                        <img 
                                            ref={imageRef}
                                            src={`http://localhost:8080/api/inspections/images/${inspection.maintenanceImagePath}`}
                                            alt="AI Analysis with Bounding Boxes"
                                            className='w-full h-auto object-contain block'
                                            crossOrigin="anonymous"
                                        />
                                        {boundingBoxes.length > 0 && (
                                            <canvas
                                                ref={canvasRef}
                                                className='absolute top-0 left-0 pointer-events-none'
                                            />
                                        )}
                                    </div>

                                    {/* Anomalies Summary */}
                                    {boundingBoxes.length > 0 && (
                                        <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                                            <div className='flex items-center space-x-3'>
                                                <Brain className='w-5 h-5 text-blue-600' />
                                                <div>
                                                    <p className='text-sm font-semibold text-gray-800'>
                                                        {boundingBoxes.length} anomal{boundingBoxes.length !== 1 ? 'ies' : 'y'} detected
                                                    </p>
                                                    <p className='text-xs text-gray-600'>
                                                        View analysis in the comparison view above
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Detection Details */}
                                    {boundingBoxes.length > 0 && (
                                        <div className='mt-6 space-y-2'>
                                            <h4 className='font-semibold text-sm text-gray-700'>Detection Details:</h4>
                                            {boundingBoxes.map((pred, idx) => {
                                                const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
                                                const colorClass = pred.class === 0 ? 'text-red-600' : pred.class === 1 ? 'text-green-600' : 'text-orange-600';
                                                const bgColor = pred.class === 0 ? 'bg-red-600' : pred.class === 1 ? 'bg-green-600' : 'bg-orange-600';
                                                
                                                return (
                                                    <div key={idx} className='bg-gray-50 rounded border border-gray-200 p-3'>
                                                        <div className='flex items-center justify-between mb-3'>
                                                            <div className='flex items-center gap-2'>
                                                                <span className={`${bgColor} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                                                    Error {idx + 1}
                                                                </span>
                                                                <span className={`font-medium ${colorClass} text-sm`}>{className}</span>
                                                            </div>
                                                            <span className='text-gray-600 text-sm'>
                                                                Confidence: {(pred.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className='text-xs text-gray-600'>
                                                            <p className='mb-1'>
                                                                <span className='font-medium'>Box Coordinates:</span> X1: {pred.box[0].toFixed(2)}, Y1: {pred.box[1].toFixed(2)}, X2: {pred.box[2].toFixed(2)}, Y2: {pred.box[3].toFixed(2)}
                                                            </p>
                                                            <p>
                                                                <span className='font-medium'>Dimensions:</span> Width: {(pred.box[2] - pred.box[0]).toFixed(2)}px, Height: {(pred.box[3] - pred.box[1]).toFixed(2)}px
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 3: Last Month */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Last Month</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        kVA
                                    </label>
                                    <input
                                        type='text'
                                        name='lastMonthKVA'
                                        value={formData.lastMonthKVA}
                                        onChange={handleFormInputChange}
                                        placeholder='Enter Value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Date
                                    </label>
                                    <input
                                        type='date'
                                        name='lastMonthDate'
                                        value={formData.lastMonthDate}
                                        onChange={handleFormInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Time
                                    </label>
                                    <select
                                        name='lastMonthTime'
                                        value={formData.lastMonthTime}
                                        onChange={handleFormInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>Select Time</option>
                                        <option value='Morning'>Morning</option>
                                        <option value='Afternoon'>Afternoon</option>
                                        <option value='Evening'>Evening</option>
                                        <option value='Night'>Night</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 4: Current Month */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Current Month</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Current Month kVA
                                    </label>
                                    <input
                                        type='text'
                                        name='currentMonthKVA'
                                        value={formData.currentMonthKVA}
                                        onChange={handleFormInputChange}
                                        placeholder='Enter Value'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Baseline Condition
                                    </label>
                                    <select
                                        name='baselineCondition'
                                        value={formData.baselineCondition}
                                        onChange={handleFormInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>Select Weather</option>
                                        <option value='Sunny'>Sunny</option>
                                        <option value='Cloudy'>Cloudy</option>
                                        <option value='Rainy'>Rainy</option>
                                        <option value='Windy'>Windy</option>
                                        <option value='Foggy'>Foggy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Transformer Type
                                    </label>
                                    <select
                                        name='transformerType'
                                        value={formData.transformerType}
                                        onChange={handleFormInputChange}
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>Select Type</option>
                                        <option value='Distribution'>Distribution</option>
                                        <option value='Power'>Power</option>
                                        <option value='Instrument'>Instrument</option>
                                        <option value='Auto'>Auto</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300 my-6'></div>

                        {/* Section 5: Meter Details */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Meter Details</h3>
                            
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Serial Number
                                    </label>
                                    <input
                                        type='text'
                                        name='meterSerialNumber'
                                        value={formData.meterSerialNumber}
                                        onChange={handleFormInputChange}
                                        placeholder='Enter Serial Number'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Meter CT Ratio
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type='text'
                                            name='meterCTRatio'
                                            value={formData.meterCTRatio}
                                            onChange={handleFormInputChange}
                                            placeholder='Enter Value'
                                            className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'>/5A</span>
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Make
                                    </label>
                                    <input
                                        type='text'
                                        name='meterMake'
                                        value={formData.meterMake}
                                        onChange={handleFormInputChange}
                                        placeholder='Enter Make'
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
