import React from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import NavigationBar from '../components/NavigationBar'
import Head from '../components/InspectionDetails/Head'
import ImageUpload from '../components/InspectionDetails/ImageUpload'
import AiAnalysisDisplay from '../components/InspectionDetails/AiAnalysisDisplay'
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
        console.log("Updated inspection after image upload:", updatedInspection);
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
            <NavigationBar />
            <div className='flex flex-col m-10 min-h-screen' style={{ marginTop: '80px' }}>
                <div>
                    <h1 className='text-3xl font-bold text-blue-900 mb-10'>Inspection</h1>
                </div>
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <Head inspection={inspection} onInspectionUpdate={handleInspectionUpdate} />
                </div>
                <ImageUpload inspection={inspection} onInspectionUpdate={handleInspectionUpdate} />
                
                {/* AI Analysis Display */}
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mt-6'>
                    <h2 className='text-xl font-semibold text-gray-800 mb-4'>AI Thermal Analysis</h2>
                    <AiAnalysisDisplay 
                        inspection={inspection} 
                        onRefresh={fetchInspection}
                    />
                </div>
            </div>
            <Footer />
        </>
    );
};

export default InspectionDetails;
