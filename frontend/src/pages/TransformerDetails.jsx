import React from 'react'
import { useParams } from 'react-router'
import inspections from '../constants/inspections.json'
import { useState } from 'react'

const TransformerDetails = () => {
    const { id } = useParams();
    const transformer = inspections.find(transformer => transformer.id === id);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadImage, setUploadImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

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

    if (!transformer) return <div>Transformer not found</div>;
    return (
        <>
            <div className='flex flex-col m-10 min-h-screen'>
                <div>
                    <h1 className='text-2xl font-bold'>Transformer</h1>
                </div>
            </div>

        {/* <div className='p-6 space-y-6'>
            <div className='bg-white shadow-md rounded-lg p-6 border border-gray-200'>
                <h2 className='text-xl font-semibold text-blue-600 mb-4'>Transformer Details</h2>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='font-semibold text-gray-700'>ID</div>
                    <div>{transformer.id}</div>

                    <div className='font-semibold text-gray-700'>Pole No</div>
                    <div>{transformer.pole_no}</div>

                    <div className='font-semibold text-gray-700'>Branch</div>
                    <div>{transformer.region}</div>

                    <div className='font-semibold text-gray-700'>Status</div>
                    <div>{transformer.status}</div>
                </div>
            </div>
            <div className='bg-gray-50 border rounded-lg p-6 shadow-sm w-1/3'>
                <h3 className='text-center font-medium'>Thermal Image Upload</h3>

                {uploadImage ? (
                    <img src={uploadImage} alt="Transformer Thermal" className='w-64 object-cover rounded-md border' />
                ):(
                    <div className='text-center text-gray-500 mb-6'>No image uploaded</div>
                )}

                <label className='flex px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 justify-center'>
                    Upload Image
                    <input type="file" accept="image/*" onChange={handleFileChange} className='hidden' />
                </label>
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
        </div> */}
        </>
    );
};

export default TransformerDetails;
