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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInspection = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8080/api/inspections/${inspectionNo}`);
            setInspection(response.data);
        } catch (error) {
            console.error("Error fetching inspection:", error);
            setError("Failed to load inspection details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspection();
    }, [inspectionNo]);

    const handleInspectionUpdate = (updatedInspection) => {
        setInspection(updatedInspection);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading inspection details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-600 text-lg">{error}</div>
            </div>
        );
    }

    if (!inspection) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Inspection not found</div>
            </div>
        );
    }

    return (
        <>  
            <div className='flex flex-col m-10 min-h-screen'>
                <div>
                    <h1 className='text-3xl font-bold text-blue-900 mb-10'>Inspection</h1>
                </div>
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <Head inspection={inspection} onInspectionUpdate={handleInspectionUpdate} />
                </div>
                <ImageUpload inspection={inspection} onInspectionUpdate={handleInspectionUpdate} />
            </div>
            <Footer />
        </>
    );
};

export default InspectionDetails;
