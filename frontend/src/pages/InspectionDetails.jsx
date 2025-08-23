import React from 'react'
import { useParams } from 'react-router'
import inspections from '../constants/inspections.json'
import { useState } from 'react'
import Head from '../components/TransformerDetails/Head'
import ImageUpload from '../components/TransformerDetails/ImageUpload'
import Footer from '../components/Footer'

const InspectionDetails = () => {
    const { id } = useParams();
    const inspection = inspections.find(inspection => inspection.id === id);

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

    if (!inspection) return <div>Inspection not found</div>;
    return (
        <>  
            <div className='flex flex-col m-10 min-h-screen'>
                <div>
                    <h1 className='text-3xl font-bold text-blue-900 mb-10'>Inspection</h1>
                </div>
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <Head />
                </div>
                <ImageUpload />
            </div>
            <Footer />
        </>
    );
};

export default InspectionDetails;
