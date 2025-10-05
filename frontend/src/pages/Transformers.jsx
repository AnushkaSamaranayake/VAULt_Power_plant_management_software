import React from 'react'
import axios from 'axios'
import Head from '../components/Transformers/Head'
import TransformerTable from '../components/Transformers/TransformerTable'
// import inspections from '../constants/inspections.json'
import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
// import { useParams } from 'react-router-dom'
import NavigationBar from '../components/NavigationBar'


const Transformers = () => {

    const [activeTable, setActiveTable] = useState("transformers");

    const [transformers, setTransformers] = useState([]);
    const [inspections, setInspections] = useState([]);

    const fetchInspections = () => {
        axios.get("http://localhost:8080/api/inspections")
            .then((response) => {
                setInspections(response.data || []);
            })
            .catch((error) => {
                console.error("Error fetching inspections:", error);
                setInspections([]);
            });
    };

    const fetchTransformers = () => {
        axios.get("http://localhost:8080/api/transformers")
            .then((response) => {
                setTransformers(response.data || []);
            })
            .catch((error) => {
                console.error("Error fetching transformers:", error);
                setTransformers([]);
            });
    };

    const handleInspectionAdded = () => {
        fetchInspections();
    };

    const handleTransformerDeleted = (deletedTransformerNo) => {
        setTransformers(prev => prev.filter(transformer => transformer.transformerNo !== deletedTransformerNo));
        // Also remove related inspections
        setInspections(prev => prev.filter(inspection => inspection.transformerNo !== deletedTransformerNo));
    };

    const handleInspectionDeleted = (deletedInspectionNo) => {
        setInspections(prev => prev.filter(inspection => inspection.inspectionNo !== deletedInspectionNo));
    };

    useEffect(() => {
        fetchTransformers();
    }, []);

    useEffect(() => {
        fetchInspections();
    }, []);

    // Step 1: Reduce inspections to unique transformers
    const transformerMap = new Map();

    transformers.forEach((transformer) => {
        if (!transformerMap.has(transformer.transformerNo)) {
        transformerMap.set(transformer.transformerNo, {
            transformerNo: transformer.transformerNo,
            poleNo: transformer.poleNo,
            region: transformer.region,
            type: transformer.type,
        });
        }
    });

    // Step 2: Convert to array
    const uniqueTransformers = Array.from(transformerMap.values());

    return (
        <>
            <NavigationBar />
            <div className='flex flex-col mx-10 mt-20 min-h-screen'>
                <div className='flex flex-row justify-between items-center mb-10'>
                    <h1 className='text-3xl font-bold text-blue-900'>Transformers</h1>
                </div>
                <div className='flex flex-col bg-white p-5 rounded-md shadow-md'>
                    <Head activeTable={activeTable} setActiveTable={setActiveTable} onInspectionAdded={handleInspectionAdded} />
                    <TransformerTable 
                        activeTable={activeTable} 
                        transformers={uniqueTransformers} 
                        inspections={inspections} 
                        onTransformerDeleted={handleTransformerDeleted}
                        onInspectionDeleted={handleInspectionDeleted}
                    />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Transformers
