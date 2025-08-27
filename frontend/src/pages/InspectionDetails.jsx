import React from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Head from '../components/InspectionDetails/Head'
import ImageUpload from '../components/InspectionDetails/ImageUpload'
import Footer from '../components/Footer'

const InspectionDetails = () => {


    const { inspectionNo } = useParams();

    const [inspection, setInspection] = useState(null);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/inspections/${inspectionNo}`)
            .then((response) => {
                setInspection(response.data);
            })
            .catch((error) => {
                console.error("Error fetching inspections:", error);
            });
    }, [inspectionNo]);


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
                    <Head inspection={inspection} />
                </div>
                <ImageUpload />
            </div>
            <Footer />
        </>
    );
};

export default InspectionDetails;
