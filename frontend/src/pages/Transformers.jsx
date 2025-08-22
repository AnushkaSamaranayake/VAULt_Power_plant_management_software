import React from 'react'
import Head from '../components/Transformers/Head'
import TransformerTable from '../components/Transformers/TransformerTable'
import { useState } from 'react'
import Footer from '../components/Footer'

const Transformers = () => {

    const [activeTable, setActiveTable] = useState("transformers");

    return (
        <>
            <div className='flex flex-col m-10 min-h-screen'>
                <div className='flex flex-row justify-between items-center mb-10'>
                    <h1 className='text-3xl font-bold text-blue-900'>Transformers</h1>
                </div>
                <div className='flex flex-col bg-white p-5 rounded-md shadow-md'>
                    <Head activeTable={activeTable} setActiveTable={setActiveTable} />
                    <TransformerTable activeTable={activeTable}/>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Transformers
