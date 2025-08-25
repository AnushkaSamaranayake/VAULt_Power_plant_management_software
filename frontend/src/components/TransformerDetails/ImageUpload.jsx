import React from 'react'
import { useState } from 'react';
import { useParams } from 'react-router';
import inspection from '../../constants/inspections.json'

const ImageUpload = () => {
    const { id } = useParams();
    const transformer = inspection.find(transformer => transformer.id === id);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadImage, setUploadImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const getStatusColor = (Ti_status) => {
        switch (Ti_status) {
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

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    };

    const handleDeleteImage = () => {
        setUploadImage(null);
        setUploadProgress(0);
    };

    const processFile = (file) => {
        setUploadProgress(0);
        setShowUploadModal(true);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);

                const imgUrl = URL.createObjectURL(file);
                setUploadImage(imgUrl);

                setTimeout(() => {
                    setShowUploadModal(false);
                }, 500);
            }
        }, 300);
    };

    return (
        <div className='flex flex-row items-start justify-between'>
            <div className='flex flex-col bg-white w-1/3 shadow-md rounded-md p-6'>
                <div className='flex flex-row items-center justify-between mb-6'>
                    <h1 className='font-semibold text-md'>Thermal Image</h1>
                    <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(transformer?.Ti_status)}`}>{transformer?.Ti_status}</div>

                </div>
                <p className='text-sm text-gray-700 mb-10'>Upload a thermal image of the transformer to identify potential issues.</p>

                <div>
                    <form action="">
                        <div className='mb-6'>
                            <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-2">Weather Condition</label>
                            <select name="weather" id="weather" className='border p-2 rounded-md w-full text-sm'>
                                <option value="sunny">Sunny</option>
                                <option value="cloudy">Cloudy</option>
                                <option value="rainy">Rainy</option>
                                <option value="snowy">Snowy</option>
                            </select>
                        </div>
                        <div className='space-y-4'>
                            {uploadImage ? (
                                <button 
                                    onClick={handleDeleteImage}
                                    className='flex px-4 py-2 bg-red-500 text-white text-sm rounded-lg cursor-pointer hover:bg-red-600 justify-center w-full'
                                    type="button"
                                >
                                    Delete Image
                                </button>
                            ) : (
                                <label className='flex px-4 py-2 bg-blue-500 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-600 justify-center w-full'>
                                    Upload Image
                                    <input type="file" accept="image/*" onChange={handleFileChange} className='hidden' />
                                </label>
                            )}
                            
                            {/* Drag & Drop Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                    flex flex-col items-center justify-center
                                    h-32 p-4 border-2 border-dashed rounded-xl
                                    ${isDragging 
                                        ? 'border-blue-400 bg-blue-50' 
                                        : 'border-gray-300 bg-gray-50'
                                    }
                                    transition-colors duration-200
                                `}
                            >
                                {uploadImage ? (
                                    <img
                                        src={uploadImage}
                                        alt="Uploaded preview"
                                        className="max-h-full rounded-lg shadow-sm"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-500 text-sm">Drag and Drop Image to upload</p>
                                        <p className="text-gray-400 text-xs mt-1">or use the upload button above</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {showUploadModal && (
                            <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-40'>
                                <div className='bg-white p-6 rounded-lg shadow-lg w-96'>
                                    <h3 className='text-lg font-semibold mb-4'>Uploading.....</h3>
                                    <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                                        <div className='bg-blue-500 h-4 transition-all duration-200'
                                        style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className='text-right text-gray-500 text-sm mt-2'>{uploadProgress}%</p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className='flex flex-col mt-10'>
                    <h2 className='font-semibold text-md mb-5'>Progress</h2>
                    <div className='flex flex-col'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm text-gray-700'>Image Upload</span>
                            <span className='text-sm font-semibold'>{uploadProgress}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                            <div className='bg-yellow-500 h-2 transition-all duration-200'
                            style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <div className='flex items-center justify-between mb-2 mt-4'>
                            <span className='text-sm text-gray-700'>AI Analysis</span>
                            <span className='text-sm font-semibold'>{uploadProgress}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                            <div className='bg-yellow-500 h-2 transition-all duration-200'
                            style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <div className='flex items-center justify-between mb-2 mt-4'>
                            <span className='text-sm text-gray-700'>Thermal Image Review</span>
                            <span className='text-sm font-semibold'>{uploadProgress}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                            <div className='bg-yellow-500 h-2 transition-all duration-200'
                            style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

            </div>
            {uploadImage && (
                <div className='flex flex-col bg-white w-2/3 shadow-md rounded-md p-6 ml-10'>
                    <div className='flex flex-row items-center justify-between mb-6'>
                        <h1 className='font-semibold text-md'>Thermal Image Comparison</h1>
                        <div className={`px-4 py-1 text-center text-xs font-medium rounded-full w-fit ${getStatusColor(transformer?.Ti_status)}`}>{transformer?.Ti_status}</div>
                    </div>
                    <img src={uploadImage} alt="Transformer Thermal" className='w-64 object-cover rounded-md border' />
                </div>
            )}

        </div>
    )
}

export default ImageUpload
