import React from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FileText, Printer } from 'lucide-react'
import NavigationBar from '../components/NavigationBar'
import Head from '../components/InspectionDetails/Head'
import ImageUpload from '../components/InspectionDetails/ImageUpload'
import BaselineAiComparisonDisplay from '../components/InspectionDetails/BaselineAiComparisonDisplay'
import Footer from '../components/Footer'

const InspectionDetails = () => {
    const { inspectionNo } = useParams();
    const navigate = useNavigate();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formStatus, setFormStatus] = useState({ isFinalized: false });
    const [loadingFormStatus, setLoadingFormStatus] = useState(true);

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

    const fetchFormStatus = async () => {
        try {
            setLoadingFormStatus(true);
            const response = await axios.get(`http://localhost:8080/api/inspection-report-forms/${inspectionNo}/status`);
            setFormStatus(response.data);
        } catch (error) {
            console.error("Error fetching form status:", error);
            // If form doesn't exist yet, it's not finalized
            setFormStatus({ isFinalized: false });
        } finally {
            setLoadingFormStatus(false);
        }
    };

    useEffect(() => {
        fetchInspection();
        fetchFormStatus();
    }, [inspectionNo]);

    const handleInspectionUpdate = (updatedInspection) => {
        console.log("Updated inspection after image upload:", updatedInspection);
        setInspection(updatedInspection);
    };

    const handleFormStatusUpdate = () => {
        // Refresh form status when form is saved
        fetchFormStatus();
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
                
                {/* Baseline vs AI Analysis Comparison */}
                <BaselineAiComparisonDisplay 
                    inspection={inspection} 
                    onRefresh={fetchInspection}
                />

                {/* Thermal Image Inspection Form */}
                <div className='flex flex-col p-6 bg-white rounded-md shadow-md mt-10'>
                    <h2 className='text-xl font-semibold text-gray-800 mb-6'>Thermal Image Inspection Form</h2>
                    <div className='flex gap-4'>
                        <button 
                            onClick={() => navigate(`/inspection/${inspectionNo}/form`)}
                            className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
                            disabled={loadingFormStatus}
                        >
                            <FileText className='w-5 h-5' />
                            {loadingFormStatus 
                                ? 'Loading...' 
                                : formStatus.isFinalized 
                                    ? 'Show Inspection Form' 
                                    : 'Fill Inspection Form'
                            }
                        </button>
                        <button 
                            className='flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium'
                        >
                            <Printer className='w-5 h-5' />
                            Print Inspection Record
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default InspectionDetails;
