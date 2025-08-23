import React from 'react'
import { useParams } from 'react-router'
import inspections from '../constants/inspections.json'
import { useState } from 'react'
import Head from '../components/TransformerDetails/Head'
import InspectionTable from '../components/TransformerDetails/InspectionTable'
import Footer from '../components/Footer'

const TransformerDetails = () => {

    const { id } = useParams();
    const filteredInspection = inspections.filter(inspection => inspection.id === id); //here inspection id is transformerId

    return (
        <>
            <div className='flex flex-col m-10 min-h-screen'>
                <div>
                    <h1 className='text-3xl font-bold text-blue-900 mb-10'>Transformer</h1>
                </div>
                <div className='flex flex-col p-5 bg-white rounded-md shadow-md mb-10'>
                    <Head/>
                </div>
                <InspectionTable inspections={filteredInspection} />
            </div>
            <Footer />
        </>
    );
};

export default TransformerDetails;