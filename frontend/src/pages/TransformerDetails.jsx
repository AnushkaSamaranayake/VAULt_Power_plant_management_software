import React from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Head from '../components/TransformerDetails/Head_fixed'
import InspectionTable from '../components/TransformerDetails/InspectionTable'
import Footer from '../components/Footer'
import AddInspector from '../components/Transformers/AddInspector';

const TransformerDetails = () => {
    const { transformerNo } = useParams();
    const [transformer, setTransformer] = useState(null);
    const [inspections, setInspections] = useState([]);
    const [showAddInspection, setShowAddInspection] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTransformer = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/transformers/${transformerNo}`);
            setTransformer(response.data);
        } catch (error) {
            console.error("Error fetching transformer:", error);
            setError("Failed to load transformer details");
        }
    };

    const fetchInspections = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/inspections");
            setInspections(response.data || []);
        } catch (error) {
            console.error("Error fetching inspections:", error);
            setInspections([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchTransformer(), fetchInspections()]);
        };
        fetchData();
    }, [transformerNo]);

    const handleTransformerUpdate = (updatedTransformer) => {
        setTransformer(updatedTransformer);
    };

    const handleInspectionRefresh = () => {
        fetchInspections();
    };

    const handleInspectionDeleted = (deletedInspectionNo) => {
        setInspections(prev => prev.filter(inspection => inspection.inspectionNo !== deletedInspectionNo));
    };

    const filteredInspection = inspections.filter(inspection => inspection.transformerNo === transformerNo);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading transformer details...</div>
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

    if (!transformer) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Transformer not found</div>
            </div>
        );
    }

    return (
        <>
            <div className='flex flex-col m-10 min-h-screen'>
                <div>
                    <h1 className='text-3xl font-bold text-blue-900 mb-10'>Transformer</h1>
                </div>
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <Head transformer={transformer} onTransformerUpdate={handleTransformerUpdate} />
                </div>
                
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <div className='flex flex-row items-center justify-between mb-5'>
                        <h2 className='text-xl font-semibold text-blue-800'>Inspections</h2>
                        <button 
                            className='ml-5 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors' 
                            onClick={() => setShowAddInspection(true)}
                        >
                            Add Inspection
                        </button>
                    </div>
                    <InspectionTable 
                        inspections={filteredInspection} 
                        onInspectionDeleted={handleInspectionDeleted}
                    />
                </div>
                {showAddInspection && (
                    <AddInspector 
                        onClose={() => setShowAddInspection(false)} 
                        onInspectionAdded={handleInspectionRefresh}
                    />
                )}
            </div>
            <Footer />
        </>
    );
};

export default TransformerDetails;