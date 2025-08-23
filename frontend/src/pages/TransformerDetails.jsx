import React from 'react'
import axios from 'axios'
import { useParams } from 'react-router'
// import inspections from '../constants/inspections.json'
import { useState, useEffect } from 'react'
import Head from '../components/TransformerDetails/Head'
import InspectionTable from '../components/TransformerDetails/InspectionTable'
import Footer from '../components/Footer'
import AddInspector from '../components/Transformers/AddInspector';

const TransformerDetails = () => {

    const { transformerNo } = useParams();

    const [transformer, setTransformer] = useState(null);
    const [inspections, setInspections] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/transformers/${transformerNo}`)
            .then((response) => {
                setTransformer(response.data);
            })
            .catch((error) => {
                console.error("Error fetching transformer:", error);
            });
    }, [transformerNo]);

    useEffect(() => {
        axios.get("http://localhost:8080/api/inspections")
            .then((response) => {
                setInspections(response.data);
            })
            .catch((error) => {
                console.error("Error fetching inspections:", error);
            });
    }, []);

    const filteredInspection = inspections.filter(inspection => inspection.transformerNo === transformerNo);


    const [showAddInspection, setShowAddInspection] = useState(false);

    return (
        <>
            <div className='flex flex-col m-10 min-h-screen'>
                <div>
                    <h1 className='text-3xl font-bold text-blue-900 mb-10'>Transformer</h1>
                </div>
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <Head transformer={transformer} />
                </div>
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <div className='flex flex-row items-center justify-between mb-5'>
                        <h2 className='text-xl font-semibold text-blue-800'>Inspections</h2>
                        <button className='ml-5 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm' onClick={() => setShowAddInspection(true)}>Add Inspection</button>
                    </div>
                    <InspectionTable inspections={filteredInspection} />
                </div>
                {showAddInspection && <AddInspector onClose={() => setShowAddInspection(false)} />}
            </div>
            <Footer />
        </>
    );
};

export default TransformerDetails;