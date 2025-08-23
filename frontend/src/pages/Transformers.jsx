import React from 'react'
import Head from '../components/Transformers/Head'
import TransformerTable from '../components/Transformers/TransformerTable'
import inspections from '../constants/inspections.json'
import { useState } from 'react'
import Footer from '../components/Footer'
import { useParams } from 'react-router'

const Transformers = () => {

    const [activeTable, setActiveTable] = useState("transformers");
    
    // Step 1: Reduce inspections to unique transformers
    const transformerMap = new Map();

    inspections.forEach((inspection) => {
        if (!transformerMap.has(inspection.id)) {
        transformerMap.set(inspection.id, {
            id: inspection.id,
            pole_no: inspection.pole_no,
            region: inspection.region,
            type: inspection.type,
        });
        }
    });

    // Step 2: Convert to array
    const uniqueTransformers = Array.from(transformerMap.values());

    return (
        <>
            <div className='flex flex-col m-10 min-h-screen'>
                <div className='flex flex-row justify-between items-center mb-10'>
                    <h1 className='text-3xl font-bold text-blue-900'>Transformers</h1>
                </div>
                <div className='flex flex-col bg-white p-5 rounded-md shadow-md'>
                    <Head activeTable={activeTable} setActiveTable={setActiveTable} />
                    <TransformerTable activeTable={activeTable} transformers={uniqueTransformers} inspections={inspections} />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Transformers
